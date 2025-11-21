import { useState } from "react";
import { ParameterValues } from "@/types/parameters";
import {  TaskStep } from "@/types/generation";
import { GenerationStatus } from "@/lib/config/enum";

import { toast } from "@/components/ui/sonner";
// Removed server action imports - now using API calls
import { useUserInfo } from "@/lib/contexts/user-context";
export const useGenerate = () => {
  const [taskStep, setTaskStep] = useState<TaskStep>("none");
  const [error, setError] = useState("");
  const { showInsufficientPointsModal, refreshUserInfo } = useUserInfo();

  const handleGenerate = async (tool: string, parameters: ParameterValues) => {
    setTaskStep("createTask");
    setError(""); // 清除之前的错误状态

    try {
      // 直接使用FormData传输所有数据
      const formData = new FormData();
      formData.append('tool', tool);
      
      // 处理其他参数
      const otherParams = { ...parameters };
      delete otherParams.images;
      formData.append('parameters', JSON.stringify(otherParams));
      
      // 添加图片文件（如果有的话）
      if (parameters.images && Array.isArray(parameters.images)) {
        parameters.images.forEach((image: any, index: number) => {
          if (image && image.file instanceof File) {
            formData.append(`image_${index}`, image.file);
            formData.append(`image_${index}_id`, image.id);
          }
        });
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        if (result.data?.noPoints) {
          setTaskStep("none");
          // 打开充值弹窗
          showInsufficientPointsModal();
          return null;
        }
        throw new Error(result.message || "Task generation failed");
      }
      refreshUserInfo();
      return result.data;
    } catch (error) {
      setTaskStep("none");
      setError(error instanceof Error ? error.message : String(error));
      toast.error(error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  /**
   * 轮询查询任务生成状态
   * @param recordId - 任务记录ID，用于标识要查询的任务
   * @param onStatusUpdate - 可选的状态更新回调函数，每次查询后会调用此函数传递最新状态
   * @param maxAttempts - 最大轮询尝试次数，默认30次，防止无限轮询
   * @param interval - 轮询间隔时间（毫秒），默认2000ms（2秒）
   * @returns Promise<any> - 返回最终的任务状态数据
   */
  const pollTaskStatus = async (
    recordId: string,
    onStatusUpdate?: (status: any) => void,
    maxAttempts: number = 50,
    interval: number = 5000
  ) => {
    let attempts = 0;
    setTaskStep("pollTaskStatus");

    console.log("recordId", recordId);

    const poll = async (): Promise<any> => {
      try {
        attempts++;

        // 调用API查询任务状态
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/record/${recordId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Status query failed");
        }

        const taskData = result.data;

        // 调用状态更新回调
        if (onStatusUpdate) {
          onStatusUpdate(taskData);
        }

        // 检查任务是否完成（成功或失败）
        if (
          [GenerationStatus.FAILED, GenerationStatus.SUCCEED].includes(
            taskData!.status as GenerationStatus
          )
        ) {
          setTaskStep("none");
          return taskData;
        }

        // 检查是否超过最大尝试次数
        if (attempts >= maxAttempts) {
          throw new Error(
            `Polling timeout: ${maxAttempts} attempts reached, task not completed`
          );
        }

        // 等待指定间隔后继续轮询
        await new Promise((resolve) => setTimeout(resolve, interval));
        return poll();
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        setTaskStep("none");
        throw error;
      }
    };

    return poll();
  };

  return {
    taskStep,
    error,
    handleGenerate,
    pollTaskStatus, // 添加轮询函数
  };
};
