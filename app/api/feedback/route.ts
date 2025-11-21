import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customLog, customError } from "@/lib/utils/log";
import { Result } from "@/lib/utils/result";
import { db } from "@/lib/db";
import { feedBack } from "@/lib/db/schema/user";
import { auth } from "@/auth";
import { processAndUploadImages } from "@/actions/util/media";
import { FEED_BACK_TYPE } from "@/lib/config/constant";

// 定义请求参数校验schema
const feedbackRequestSchema = z.object({
    type: z.enum(FEED_BACK_TYPE, {
        required_error: "Feedback type is required",
        invalid_type_error: "Invalid feedback type"
    }),
    details: z.string().min(1, "Feedback details are required").max(2000, "Feedback details cannot exceed 2000 characters"),
});

export async function POST(request: NextRequest) {
    try {
        customLog("api > feedback > POST: Starting to process feedback submission request");

        // 获取用户会话信息
        const session = await auth();
        const sid = session?.user?.id;

        // 处理FormData请求
        const formData = await request.formData();

        // 提取基本参数
        const type = formData.get('type') as string;
        const details = formData.get('details') as string;

        // 校验必填参数
        const validationResult = feedbackRequestSchema.safeParse({
            type,
            details
        });

        if (!validationResult.success) {
            customError(`api > feedback > POST: Parameter validation failed ${JSON.stringify(validationResult.error.errors)}`);
            return NextResponse.json(
                Result.fail("Parameter validation failed", validationResult.error.errors),
                { status: 400 }
            );
        }

        const { type: validatedType, details: validatedDetails } = validationResult.data;

        // 处理图片上传（可选，最多8张）
        let screenshotUrls: string[] = [];
        const imageFiles = formData.getAll('images') as File[];

        if (imageFiles.length > 0) {
            customLog(`api > feedback > POST: 检测到${imageFiles.length}张图片文件，开始上传`);

            // 限制图片数量（最多8张）
            if (imageFiles.length > 8) {
                return NextResponse.json(
                    Result.fail("Maximum 8 images can be uploaded"),
                    { status: 400 }
                );
            }

            // 验证每个文件
            const validImageFiles: File[] = [];
            for (const imageFile of imageFiles) {
                if (!imageFile || imageFile.size === 0) continue;

                // 验证文件类型
                if (!imageFile.type.startsWith('image/')) {
                    return NextResponse.json(
                        Result.fail("Uploaded files must be in image format"),
                        { status: 400 }
                    );
                }

                // 验证文件大小 (限制为5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (imageFile.size > maxSize) {
                    return NextResponse.json(
                        Result.fail("Image file size cannot exceed 5MB"),
                        { status: 400 }
                    );
                }

                validImageFiles.push(imageFile);
            }

            if (validImageFiles.length > 0) {
                // 上传图片到Cloudflare
                const uploadResult = await processAndUploadImages(
                    validImageFiles,
                    "feedback/screenshots",
                    true
                );

                if (!uploadResult.success) {
                    customError(`api > feedback > POST: Image upload failed ${uploadResult.message}`);
                    return NextResponse.json(
                        Result.fail("Image upload failed", uploadResult.message),
                        { status: 500 }
                    );
                }

                if (uploadResult.data.uploadedImages.length > 0) {
                    screenshotUrls = uploadResult.data.uploadedImages.map(img => img.url);
                    customLog(`api > feedback > POST: ${screenshotUrls.length}张图片上传成功 ${JSON.stringify(screenshotUrls)}`);
                }
            }
        }



        const feedbackData = {
            sid: sid || null, // 如果未登录，sid为null
            type: validatedType,
            details: validatedDetails,
            urls: screenshotUrls,
        };

        customLog(`api > feedback > POST: 准备保存反馈数据 ${JSON.stringify(feedbackData)}`);

        const insertResult = await db.insert(feedBack).values(feedbackData).returning();

        if (insertResult.length === 0) {
            customError("api > feedback > POST: Database insertion failed");
            return NextResponse.json(
                Result.fail("Feedback submission failed, please try again later"),
                { status: 500 }
            );
        }

        const savedFeedback = insertResult[0];
        customLog(`api > feedback > POST: Feedback submitted successfully ${JSON.stringify(savedFeedback)}`);

        return NextResponse.json(
            Result.success({
                id: savedFeedback.id,
                message: "Feedback submitted successfully, thank you for your feedback!"
            }),
            { status: 201 }
        );

    } catch (error) {
        customError(`api > feedback > POST: Error occurred while processing feedback submission ${error}`);
        return NextResponse.json(
            Result.fail("Internal server error, please try again later"),
            { status: 500 }
        );
    }
}