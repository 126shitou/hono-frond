"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

/**
 * 自定义Toast组件，为所有toast类型提供固定的背景色样式
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      offset={80}
      duration={Infinity} // 设置为无限持续时间，toast不会自动消失
      {...props}
    />
  );
};

export { Toaster };

// 导出带默认图标的 toast 包装函数
import { toast as originalToast } from "sonner";

export const toast = {
  success: (message: string, options?: any) =>
    originalToast.success(message, {
      className: "bg-[#857BA1]! text-[#F2F2F2]! text-sm border-none!",
      position: "top-center",
      duration: 3000,
      ...options,
    }),

  error: (message: string, options?: any) =>
    originalToast.error(message, {
      className: "bg-[#857BA1]! text-[#F2F2F2]! text-sm border-none!",
      ...options,
    }),

  fail: (message: string, options?: any) =>
    originalToast.warning(message, {
      className: "bg-[#857BA1]! text-[#F2F2F2]! text-sm border-none!",
      ...options,
    }),
  dismiss: () => originalToast.dismiss(),
  loading: (message: string, options?: any) =>
    originalToast.success(message, {
      className: "!bg-[#857BA1] !text-[#F2F2F2] !text-sm !border-none",
      position: "top-center",
      duration: Infinity,
      ...options,
    }),
};
