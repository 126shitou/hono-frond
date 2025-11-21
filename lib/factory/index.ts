import "server-only";

import { ToolFactory } from "./base";
import { AiImgGeneratorTool } from "./ai-image-generator";
import { FaceSwapTool } from "./face-swap";
import { ImageUpscalerTool } from './image-upscaler';
import { BackRemoveTool } from './background-remover';
// 注册所有模型
ToolFactory.register("ai-image-generator", new AiImgGeneratorTool());
ToolFactory.register("face-swap", new FaceSwapTool());
ToolFactory.register("image-upscaler", new ImageUpscalerTool());
ToolFactory.register("background-remover", new BackRemoveTool());

// 从模型提取UI配置的工具函数
export function getModelConfigFromModel(modelName: string) {
  const model = ToolFactory.getTool(modelName);
  return model || null;
}

// 导出工厂和类型
export { ToolFactory };
export * from "./base";
