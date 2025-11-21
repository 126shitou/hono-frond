import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customLog, customError } from "@/lib/utils/log";
import { Result } from "@/lib/utils/result";
import { ToolFactory } from "@/lib/factory";
import { db, sql } from "@/lib/db";
import { records, tasks } from "@/lib/db/schema/generation";
import { GenerationStatus } from "@/lib/config/enum";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";



const baseRequestSchema = z.object({
    tool: z.string().min(1, "Model ID cannot be empty."),
    parameters: z.record(z.any()), // 参数由具体生成器验证
});

export async function POST(request: NextRequest) {
    let newRecord: any; // 声明变量以便在catch块中使用
    let deductedPoints = 0; // 记录已扣除的积分数量
    let deductedDetail: { bounds?: number; membership?: number; topup?: number } = {}; // 记录扣除的详细信息
    let sid: string | undefined; // 声明在外层作用域，以便catch块中使用

    try {
        customLog("api > generate > POST: 开始处理生成请求");

        // 获取用户会话信息
        const session = await auth();
        sid = session?.user?.id;

        // 直接处理FormData请求
        const formData = await request.formData();
        const tool = formData.get('tool') as string;
        const parametersStr = formData.get('parameters') as string;

        if (!tool || !parametersStr) {
            return NextResponse.json(
                Result.fail("Missing required fields: tool or parameters"),
                { status: 400 }
            );
        }

        const parameters = JSON.parse(parametersStr);

        // 处理图片文件
        const images: any[] = [];
        let imageIndex = 0;

        while (true) {
            const imageFile = formData.get(`image_${imageIndex}`) as File;
            const imageId = formData.get(`image_${imageIndex}_id`) as string;

            if (!imageFile) break;

            images.push({
                id: imageId,
                file: imageFile,
                preview: '' // FormData中不需要preview
            });

            imageIndex++;
        }

        if (images.length > 0) {
            parameters.images = images;
        }

        const requestData = { tool, parameters };

        // 验证基础请求格式
        const validatedRequest = baseRequestSchema.parse(requestData);

        // 获取Tool实例 
        const { tool: validatedTool, parameters: requestParameters } = validatedRequest;
        const toolInstance = ToolFactory.getTool(validatedTool);

        // 获取不到Tool实例 则抛出异常
        if (!toolInstance) {
            customError(
                `api > generate > POST: 不支持的工具 - Tool: ${validatedTool}, Supported: ${ToolFactory.getSupportedTools().join(
                    ", "
                )}`
            );
            return NextResponse.json(Result.fail(`Unsupported tools: ${validatedTool}`), { status: 400 });
        }

        // 参数校验
        const paramValidation = toolInstance
            .getValidationSchema()
            .safeParse(requestParameters);

        // 参数校验失败 则抛出异常
        if (!paramValidation.success) {
            const errors = paramValidation.error.flatten().fieldErrors;
            const firstError = Object.values(errors).flat()[0];
            customError(
                `api > generate > POST: 模型参数校验 - ${JSON.stringify(
                    errors
                )}`
            );
            return NextResponse.json(Result.fail(firstError || "Model parameter validation failed"), { status: 400 });
        }

        const validatedParameters = paramValidation.data;

        // 查询需要消耗的积分
        const pointsCount = toolInstance.calculatePoints(validatedParameters);

        let currentPoints = {
            boundsPoints: 0,
            membershipPoints: 0,
            topupPoints: 0,
            totalPoints: 0,
        };



        // 如果登录了 查询积分是否足够
        if (pointsCount > 0) {
            // ⭐ 使用 FOR UPDATE 锁查询用户当前积分，防止并发超扣
            const userFromDb = await sql`
                SELECT 
                    bounds_points,
                    membership_points,
                    topup_points,
                    total_points
                FROM users
                WHERE sid = ${sid}
                FOR UPDATE
            `;

            if (userFromDb.length === 0) {
                return NextResponse.json(Result.fail("User does not exist"), { status: 404 });
            }

            currentPoints = {
                boundsPoints: userFromDb[0].bounds_points,
                membershipPoints: userFromDb[0].membership_points,
                topupPoints: userFromDb[0].topup_points,
                totalPoints: userFromDb[0].total_points,
            };

            // 检查积分是否足够
            if (currentPoints.totalPoints < pointsCount) {
                return NextResponse.json(
                    Result.fail(
                        `Insufficient points. Current points: ${currentPoints.totalPoints}, Points required: ${pointsCount}`,
                        {
                            noPoints: true,
                        }
                    ),
                    { status: 400 }
                );
            }
        }

        // 创建record记录并获取创建的record
        [newRecord] = await db
            .insert(records)
            .values({
                sid: sid || "anonymous", // 用户ID，如果未登录则使用匿名
                type: toolInstance.getReturnType(), // 生成类型，
                tool: tool, // 使用的工具
                parameters: validatedParameters, // 生成参数
                expectedCount: validatedParameters.num || 1, // 期望生成数量，默认为1
                pointsCount: pointsCount, // 积分消耗
            })
            .returning();

        customLog(`创建的record记录: ${JSON.stringify(newRecord)}`);

        // 获取请求配置
        const requestConfig = await toolInstance.buildTaskRequest(
            validatedParameters
        );

        console.log("requestConfig", JSON.stringify(requestConfig));
        // 向三方平台发送请求
        const response = await fetch(requestConfig.url, requestConfig.options);

        if (!response.ok) {
            customError(
                `api > generate > POST: 第三方API请求失败 - API请求失败: ${response.status} ${response.statusText}`
            );

            // 更新record状态为失败
            await db
                .update(records)
                .set({
                    status: "fail",
                    updatedAt: new Date(),
                })
                .where(eq(records.id, newRecord.id));

            return NextResponse.json(
                Result.fail(`API request failed: ${response.status} ${response.statusText}`),
                { status: 500 }
            );
        }

        const responseData = await response.json();
        // 处理返回的数据 统一为相同的格式 taskId
        const processedResult = await toolInstance.processTaskResponse(
            responseData
        );

        customLog(`处理后的结果：${JSON.stringify(processedResult)}`);
        // 扣除积分（如果需要）
        if (pointsCount > 0) {
            try {
                const { updateData, pointsDetail } = deductPoints(
                    currentPoints.membershipPoints,
                    currentPoints.topupPoints,
                    currentPoints.boundsPoints,
                    currentPoints.totalPoints,
                    pointsCount
                );

                // 保存扣除信息以便失败时退款
                deductedPoints = pointsCount;
                deductedDetail = pointsDetail;

                // 使用事务确保积分扣除和历史记录的原子性
                const [updateResult] = await sql.transaction([
                    // 扣除积分 - 始终更新所有字段以避免条件SQL拼接问题
                    sql`
                        UPDATE users 
                        SET 
                            bounds_points = ${updateData.boundsPoints ?? currentPoints.boundsPoints},
                            membership_points = ${updateData.membershipPoints ?? currentPoints.membershipPoints},
                            topup_points = ${updateData.topupPoints ?? currentPoints.topupPoints},
                            total_points = ${updateData.totalPoints},
                            updated_at = NOW()
                        WHERE sid = ${sid}
                        RETURNING sid
                    `,
                    // 记录积分变化历史（使用 JSON 格式记录详细信息）
                    sql`
                        INSERT INTO points_history (sid, action, points, record_id, points_detail, created_at, updated_at)
                        VALUES (${sid}, 'deduct', ${-pointsCount}, ${newRecord.id}, ${pointsDetail}, NOW(), NOW())
                    `,
                ]);

                if (updateResult.length === 0) {
                    throw new Error("Failed to update user points");
                }

                customLog(
                    `积分扣除成功 - 用户${sid}扣除${pointsCount}积分，剩余${currentPoints.totalPoints - pointsCount}积分`
                );
            } catch (error: any) {
                // 积分扣除失败
                customError(`积分扣除失败 - ${error.message}`);
                return NextResponse.json(Result.fail("Points deduction failed. Please try again later."), { status: 500 });
            }
        }

        // 创建task记录
        const [newTask] = await db
            .insert(tasks)
            .values({
                recordId: newRecord.id, // 关联的record ID
                taskId: processedResult.taskId, // 第三方API返回的任务ID
                status: GenerationStatus.WAITING, // 初始状态为等待
                submitAt: new Date(), // 提交时间
            })
            .returning();

        // 更新record状态为成功
        await db
            .update(records)
            .set({
                // record的状态而不是task
                status: "success",
                updatedAt: new Date(),
            })
            .where(eq(records.id, newRecord.id));

        customLog(`创建的task记录: ${JSON.stringify(newTask)}`);

        return NextResponse.json(Result.success(newRecord.id));
    } catch (error) {
        // 正确处理Error对象的序列化，避免JSON.stringify返回空对象
        const errorMessage =
            error instanceof Error ? `${error.message}\n ` : String(error);

        customError(
            `api > generate > POST catch error - ${errorMessage}`
        );

        // 如果record已创建但发生错误，更新record状态为失败并退款
        try {
            if (typeof newRecord !== "undefined") {
                // 如果已扣除积分，需要退款
                if (deductedPoints > 0 && sid) {
                    customLog(`检测到错误，开始退款 - recordId: ${newRecord.id}, 积分: ${deductedPoints}`);
                    await refundPoints(sid, deductedPoints, newRecord.id, deductedDetail);
                }

                // 更新record状态为失败
                await db
                    .update(records)
                    .set({
                        status: "fail",
                        updatedAt: new Date(),
                    })
                    .where(eq(records.id, newRecord.id));
            }
        } catch (updateError) {
            customError(
                `api > generate > POST: 更新record状态或退款失败 - ${JSON.stringify(
                    updateError
                )}`
            );
        }

        return NextResponse.json(Result.fail((error as Error).message || "API request failed"), { status: 500 });
    }
}

/**
 * 积分扣除函数
 * 优先级：奖励积分 → 会员积分 → 充值积分
 * @returns 扣除结果，包含详细的扣除信息
 */
function deductPoints(
    membershipPoints: number,
    topupPoints: number,
    boundsPoints: number,
    totalPoints: number,
    pointsCount: number
): {
    updateData: any;
    pointsDetail: { bounds?: number; membership?: number; topup?: number };
} {
    // 计算扣除方案
    let remainingToDeduct = pointsCount;
    const updateData: any = {};
    const pointsDetail: { bounds?: number; membership?: number; topup?: number } = {};

    // 1. 优先扣除奖励积分
    if (remainingToDeduct > 0 && boundsPoints > 0) {
        const deductFromBounds = Math.min(remainingToDeduct, boundsPoints);
        updateData.boundsPoints = boundsPoints - deductFromBounds;
        pointsDetail.bounds = -deductFromBounds; // 负数表示扣除
        remainingToDeduct -= deductFromBounds;
    }

    // 2. 然后扣除会员积分
    if (remainingToDeduct > 0 && membershipPoints > 0) {
        const deductFromMembership = Math.min(remainingToDeduct, membershipPoints);
        updateData.membershipPoints = membershipPoints - deductFromMembership;
        pointsDetail.membership = -deductFromMembership; // 负数表示扣除
        remainingToDeduct -= deductFromMembership;
    }

    // 3. 最后扣除充值积分
    if (remainingToDeduct > 0 && topupPoints > 0) {
        const deductFromTopup = Math.min(remainingToDeduct, topupPoints);
        updateData.topupPoints = topupPoints - deductFromTopup;
        pointsDetail.topup = -deductFromTopup; // 负数表示扣除
        remainingToDeduct -= deductFromTopup;
    }

    // 更新总积分
    updateData.totalPoints = totalPoints - pointsCount;
    updateData.updatedAt = new Date();

    return {
        updateData,
        pointsDetail,
    };
}

/**
 * 退款函数 - 将积分精确退还到原扣除的积分池
 * 扣除顺序：奖励(bounds) → 会员(membership) → 充值(topup)
 * 退款策略：按原扣除的详细信息，精确退还到对应的积分池
 * @param sid 用户ID
 * @param pointsCount 退款积分总数
 * @param recordId 关联的记录ID
 * @param deductedDetail 原扣除的详细信息 {bounds: -5, membership: -10, topup: -3}
 * @returns 退款结果
 */
async function refundPoints(
    sid: string,
    pointsCount: number,
    recordId: string,
    deductedDetail: { bounds?: number; membership?: number; topup?: number }
): Promise<void> {
    try {
        customLog(`开始退款 - 用户${sid}，退款${pointsCount}积分，detail: ${JSON.stringify(deductedDetail)}`);

        // 检查是否已退款（防止重复退款）
        const checkResult = await sql`
            SELECT points_refunded, points_count
            FROM records 
            WHERE id = ${recordId}
        `;

        if (checkResult.length > 0 && checkResult[0].points_refunded) {
            customLog(`退款跳过 - recordId: ${recordId} 已经退款过了`);
            return;
        }

        // 获取当前用户积分
        const currentUser = await sql`
            SELECT bounds_points, membership_points, topup_points, total_points
            FROM users
            WHERE sid = ${sid}
        `;

        if (currentUser.length === 0) {
            throw new Error("User not found for refund");
        }

        // 计算退款：将负数转为正数退还到对应的积分池
        const refundToBounds = Math.abs(deductedDetail.bounds || 0);
        const refundToMembership = Math.abs(deductedDetail.membership || 0);
        const refundToTopup = Math.abs(deductedDetail.topup || 0);

        const newBoundsPoints = currentUser[0].bounds_points + refundToBounds;
        const newMembershipPoints = currentUser[0].membership_points + refundToMembership;
        const newTopupPoints = currentUser[0].topup_points + refundToTopup;
        const newTotalPoints = currentUser[0].total_points + pointsCount;

        // 构建退款详情（正数表示增加）
        const refundDetail: { bounds?: number; membership?: number; topup?: number } = {};
        if (refundToBounds > 0) refundDetail.bounds = refundToBounds;
        if (refundToMembership > 0) refundDetail.membership = refundToMembership;
        if (refundToTopup > 0) refundDetail.topup = refundToTopup;

        // 执行退款事务
        await sql.transaction([
            // 1. 退还积分到对应的积分池
            sql`
                UPDATE users 
                SET 
                    bounds_points = ${newBoundsPoints},
                    membership_points = ${newMembershipPoints},
                    topup_points = ${newTopupPoints},
                    total_points = ${newTotalPoints},
                    updated_at = NOW()
                WHERE sid = ${sid}
            `,
            // 2. 记录退款历史（使用 JSON 格式记录详细信息）
            sql`
                INSERT INTO points_history (sid, action, points, record_id, points_detail, created_at, updated_at)
                VALUES (${sid}, 'refund', ${pointsCount}, ${recordId}, ${refundDetail}, NOW(), NOW())
            `,
            // 3. 标记已退款
            sql`
                UPDATE records
                SET 
                    points_refunded = true,
                    refunded_at = NOW(),
                    updated_at = NOW()
                WHERE id = ${recordId}
            `,
        ]);

        customLog(`退款成功 - 用户${sid}已退还${pointsCount}积分 (bounds:+${refundToBounds}, membership:+${refundToMembership}, topup:+${refundToTopup})`);
    } catch (error) {
        customError(`退款失败 - 用户${sid}，错误: ${error}`);
        throw error;
    }
}