import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { customError, customLog, customSuccess } from "@/lib/utils/log";
import { db, sql } from "@/lib/db";
import { tasks, records } from "@/lib/db/schema/generation";
import { eq } from "drizzle-orm";
import { Result } from "@/lib/utils/result";
import { GenerationStatus } from "@/lib/config/enum";
import { ToolFactory } from "@/lib/factory";
import ConvertMedia from "@/actions/util/media";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ recordId: string }> }
) {
    try {
        // 验证用户登录状态
        const session = await auth();
        const uid = session?.user?.id || null;
        if (!uid) {
            return NextResponse.json(Result.fail("Please login first ！"), { status: 401 });
        }

        const { recordId } = await params;

        if (!recordId) {
            return NextResponse.json(Result.fail("Record ID is required"), { status: 400 });
        }

        customLog(`api > record > GET: 该次请求的 recordId ${recordId}`);


        // 联表查询task
        const taskRecords = await db
            .select({
                id: tasks.id,
                taskId: tasks.taskId,
                status: tasks.status,
                submitAt: tasks.submitAt,
                tool: records.tool,
                sid: records.sid,
                recordId: records.id,
            })
            .from(tasks)
            .innerJoin(records, eq(tasks.recordId, records.id))
            .where(eq(tasks.recordId, recordId))
            .limit(1);

        const taskRecord = taskRecords[0];

        // 未找到对应的task
        if (!taskRecord) {
            customError("api > record > GET: 未找到对应的任务记录");
            return NextResponse.json(Result.fail("No corresponding task record found."), { status: 404 });
        }

        // 如果状态是成功或失败 直接返回
        if (
            [GenerationStatus.SUCCEED, GenerationStatus.FAILED].includes(
                taskRecord.status as GenerationStatus
            )
        ) {
            return NextResponse.json(Result.success(taskRecord));
        }

        // 获取工具实例
        const toolInstance = ToolFactory.getTool(taskRecord.tool);

        if (!toolInstance) {
            customError(
                `api > record > GET: 不支持的工具: ${taskRecord.tool
                }, Supported: ${ToolFactory.getSupportedTools().join(", ")}`
            );
            return NextResponse.json(Result.fail(`Unsupported tools: ${taskRecord.tool}`), { status: 400 });
        }

        // 构建三方API请求
        const requestConfig = toolInstance.buildTaskStatusRequest(
            taskRecord.taskId
        );
        customLog(`第三方API请求 URL: ${requestConfig.url}`);

        // 发起第三方API请求
        const response = await fetch(requestConfig.url, requestConfig.options);

        if (!response.ok) {
            const errorMsg = `API request failed: ${response.status} ${response.statusText}`;
            customError(`api > record > GET: API请求失败 ${errorMsg}`);
            return NextResponse.json(Result.fail(errorMsg), { status: 500 });
        }

        // 处理三方响应
        const resData = await response.json();
        customSuccess(`三方API请求成功返回数据 ${JSON.stringify(resData)}`);

        const processedData = await toolInstance.processTaskStatusResponse(
            resData,
            taskRecord.taskId,
            taskRecord.recordId
        );
        customSuccess(`三方API返回数据处理成功 ${JSON.stringify(processedData)}`);

        // ⭐ 如果任务失败，需要退款
        if (processedData?.status === GenerationStatus.FAILED) {
            customLog("api > record > GET: 任务失败，开始退款流程");

            // 查询 record 信息以获取积分和退款状态
            const [recordInfo] = await db
                .select({
                    pointsCount: records.pointsCount,
                    pointsRefunded: records.pointsRefunded,
                    sid: records.sid,
                })
                .from(records)
                .where(eq(records.id, recordId))
                .limit(1);

            if (recordInfo && recordInfo.pointsCount > 0 && !recordInfo.pointsRefunded) {
                try {
                    // 执行退款
                    await refundPointsForFailedTask(
                        recordInfo.sid,
                        recordInfo.pointsCount,
                        recordId
                    );
                } catch (refundError) {
                    customError(`任务失败退款出错: ${refundError}`);
                    // 不阻断返回，只记录错误
                }
            }
        }

        // 如果任务成功且有URLs，处理媒体文件上传
        if (
            processedData?.status == GenerationStatus.SUCCEED &&
            processedData.urls.length > 0
        ) {
            customLog("api > record > GET: 任务成功 转化url中");

            try {
                // 使用ConvertMedia将所有URLs上传到Cloudflare R2
                const cloudflareUrls = await Promise.all(
                    processedData.urls.map(async (url: string) => {
                        try {
                            const cloudflareUrl = await ConvertMedia(
                                url,
                                requestConfig.authHeader as Record<string, string> | undefined,
                                {
                                    path: "generator/record",
                                    skipExisting: false,
                                    sid: taskRecord.sid,
                                    recordId: taskRecord.recordId,
                                    taskId: taskRecord.id,
                                }
                            );
                            customSuccess(
                                `媒体文件上传Cloudflare R2成功 原URL: ${url}, 新URL: ${cloudflareUrl}`
                            );
                            return cloudflareUrl;
                        } catch (error) {
                            customError(
                                `媒体文件上传Cloudflare R2失败 URL: ${url}, 错误: ${error}`
                            );
                            return null;
                        }
                    })
                );

                // 更新processedData中的URLs，过滤掉失败的上传
                processedData.urls = cloudflareUrls.filter(
                    (url) => url !== null
                ) as string[];

                customSuccess(
                    `所有媒体文件处理完成 共处理${cloudflareUrls.length}个文件`
                );
            } catch (error) {
                customError(`批量上传媒体文件到Cloudflare R2失败 ${error as string}`);
                // 即使上传失败，也返回原始数据，不中断整个流程
            }
        }

        // 返回处理后的数据
        return NextResponse.json(Result.success(processedData));
    } catch (error) {
        const errorMsg =
            error instanceof Error
                ? error.message
                : "The server has encountered an error. Please try again later.";

        customError(`api > record > GET: catch error ${errorMsg}`);
        return NextResponse.json(Result.fail(errorMsg), { status: 500 });
    }
}

/**
 * 任务失败时的退款函数
 * @param sid 用户ID
 * @param pointsCount 退款积分数量
 * @param recordId 关联的记录ID
 */
async function refundPointsForFailedTask(
    sid: string,
    pointsCount: number,
    recordId: string
): Promise<void> {
    try {
        customLog(`任务失败退款 - 用户${sid}，退款${pointsCount}积分，recordId: ${recordId}`);

        // 检查是否已退款（防止重复退款）
        const checkResult = await sql`
            SELECT points_refunded
            FROM records 
            WHERE id = ${recordId}
        `;

        if (checkResult.length > 0 && checkResult[0].points_refunded) {
            customLog(`退款跳过 - recordId: ${recordId} 已经退款过了`);
            return;
        }

        // 查询原扣除时的详细信息
        const historyResult = await sql`
            SELECT points_detail
            FROM points_history
            WHERE record_id = ${recordId} AND points < 0
            ORDER BY created_at DESC
            LIMIT 1
        `;

        let deductedDetail: { bounds?: number; membership?: number; topup?: number } = {};

        if (historyResult.length > 0 && historyResult[0].points_detail) {
            // PostgreSQL JSONB 类型会自动解析为对象
            deductedDetail = historyResult[0].points_detail;
            customLog(`查询到原扣除详情: ${JSON.stringify(deductedDetail)}`);
        } else {
            // 如果没有记录，默认退到 topup
            customLog(`未找到扣除详情，默认退到 topup`);
            deductedDetail = { topup: -pointsCount };
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

        customLog(`任务失败退款成功 - 用户${sid}已退还${pointsCount}积分 (bounds:+${refundToBounds}, membership:+${refundToMembership}, topup:+${refundToTopup})`);
    } catch (error) {
        customError(`任务失败退款失败 - 用户${sid}，错误: ${error}`);
        throw error;
    }
}