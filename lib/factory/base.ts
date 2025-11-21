import "server-only";

import { z } from "zod";
import {
  BuildTaskRequestOptions,
  RecordProcessingType,
} from "@/types/generation";

// 基础模型接口
export interface BaseTool {
  // 参数验证schema
  getValidationSchema(): z.ZodSchema<any>;
  // 构建API请求 params为任务参数
  buildTaskRequest(params: any): Promise<{
    url: string;
    options: BuildTaskRequestOptions;
  }>;
  // 处理响应
  processTaskResponse(response: any): Promise<{
    taskId: string;
  }>;
  // 构建任务状态查询请求
  buildTaskStatusRequest(taskId: string): {
    url: string;
    options: BuildTaskRequestOptions;
    authHeader?: object;
  };
  // 处理任务状态响应
  processTaskStatusResponse(
    response: any,
    taskId: string,
    recordId: string
  ): Promise<RecordProcessingType> | RecordProcessingType;
  // 获取返回类型
  getReturnType(): "image" | "video";
  // 计算需要的积分
  calculatePoints(params: any): number;
}

export class ToolFactory {
  private static tools = new Map<string, BaseTool>();

  static register(modelName: string, model: BaseTool) {
    this.tools.set(modelName, model);
  }

  static getTool(modelId: string): BaseTool | null {
    return this.tools.get(modelId) || null;
  }

  static getSupportedTools(): string[] {
    return Array.from(this.tools.keys());
  }
}
