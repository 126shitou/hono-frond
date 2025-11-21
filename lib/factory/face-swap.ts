import "server-only";

import { z } from "zod";
import { GenerationStatus } from "@/lib/config/enum";
import { BaseTool } from "./base";
import { db } from "@/lib/db";
import { tasks, records } from "@/lib/db/schema/generation";
import { eq } from "drizzle-orm";
import { processAndUploadImages } from "@/actions/util/media";

const FaceSwapSchema = z.object({
    prompt: z.string().max(100, "Prompt cannot exceed 100 characters").trim(),
    images: z.array(z.any()).max(2, "You can only upload a maximum of 2 images.").optional().default([]),

});

export class FaceSwapTool implements BaseTool {
    getValidationSchema() {
        return FaceSwapSchema;
    }

    async buildTaskRequest(paramaters: z.infer<typeof FaceSwapSchema>) {
        console.log("buildTaskRequest接收到的参数", JSON.stringify(paramaters));
        const body: any = {
            input: {
                cleanup: false,
            },
        };

        // 如果有图片URL参数，直接使用
        if (paramaters.images && paramaters.images.length > 0) {
            let images: string[] = [];

            const uploadResult = await processAndUploadImages(
                paramaters.images,
                "inputs/face-swap",
                true // 使用随机文件名
            );
            // 检查上传结果
            if (uploadResult.success) {
                images = uploadResult.data.uploadedImages.map((item) => item.url);
            }
            body.input.character_image = images[0];
            body.input.target_image = images[1];

        }


        if (paramaters.prompt) {
            body.input.prompt = paramaters.prompt;
        }
        return {
            url: "https://api.replicate.com/v1/models/fofr/face-swap-with-ideogram/predictions",
            options: {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                },
                body: JSON.stringify(body),
            },
        };
    }

    async processTaskResponse(response: any) {
        return {
            taskId: response.id,
        };
    }

    buildTaskStatusRequest(taskId: string) {
        return {
            url: `https://api.replicate.com/v1/predictions/${taskId}`,
            options: {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                },
            },
        };
    }

    async processTaskStatusResponse(response: any, taskId: string, recordId: string) {
        let status: GenerationStatus;
        let urls: string[] = [];
        let errorMessage: string = "";

        if (response.status == "failed") {
            errorMessage = response.error;
            status = GenerationStatus.FAILED;
        } else if (
            !response.output ||
            (Array.isArray(response.output) &&
                response.output.length < response.input.num_outputs)
        ) {
            status = GenerationStatus.WAITING;
        } else {
            status = GenerationStatus.SUCCEED;
            urls = Array.isArray(response.output)
                ? response.output
                : [response.output];
        }

        // 更新数据库中的任务状态
        if (taskId && [GenerationStatus.FAILED, GenerationStatus.SUCCEED].includes(status)) {

            try {
                await db
                    .update(tasks)
                    .set({
                        status: status,
                        updatedAt: new Date(),
                        result: JSON.stringify(response)
                    })
                    .where(eq(tasks.taskId, taskId));

                await db
                    .update(records)
                    .set({
                        status: status,
                        updatedAt: new Date(),
                    })
                    .where(eq(records.id, recordId));
            } catch (error) {
                console.error("更新任务状态失败:", error);
            }
        }

        return {
            urls,
            status,
            type: "image",
            error: errorMessage || "Unknown error, please try again.",
        };
    }

    // 计算需要的积分
    calculatePoints(params: any): number {
        console.log("params", params);

        return 6;
    }
    // 获取返回的类型
    getReturnType(): "image" | "video" {
        return "image";
    }
}
