import "server-only";

import { z } from "zod";
import { GenerationStatus } from "@/lib/config/enum";
import { BaseTool } from "./base";
import { db } from "@/lib/db";
import { records, tasks } from "@/lib/db/schema/generation";
import { eq } from "drizzle-orm";
import { processAndUploadImages } from "@/actions/util/media";

const AiImgGeneratorSchema = z.object({
  prompt: z.string().max(1000, "The prompt word cannot exceed 1000 characters.").trim(),
  aspectRatio: z
    .string()
    .regex(/^\d+:\d+$/, "The aspect ratio must be in the format width:height")
    .default("1:1"),
  images: z.array(z.any()).max(5, "You can upload a maximum of 5 images.").optional().default([]),
});

export class AiImgGeneratorTool implements BaseTool {
  getValidationSchema() {
    return AiImgGeneratorSchema;
  }

  async buildTaskRequest(paramaters: any) {
    console.log("buildTaskRequest接收到的参数", JSON.stringify(paramaters));
    const body: any = {
      input: {
        prompt: paramaters.prompt,
        aspect_ratio: paramaters.aspectRatio,
        output_format: "jpg",
      },
    };

    // 如果有图片URL参数，直接使用
    if (paramaters.images && paramaters.images.length > 0) {
      let images: string[] = [];

      const uploadResult = await processAndUploadImages(
        paramaters.images,
        "inputs/ai-image-generator",
        true // 使用随机文件名
      );
      // 检查上传结果
      if (uploadResult.success) {
        images = uploadResult.data.uploadedImages.map((item) => item.url);
      }
      body.input.image_input = images;
    }

    return {
      url: "https://api.replicate.com/v1/models/google/nano-banana/predictions",
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

    return 2;
  }
  // 获取返回的类型
  getReturnType(): "image" | "video" {
    return "image";
  }
}
