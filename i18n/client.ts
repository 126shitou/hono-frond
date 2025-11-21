// 标记为客户端组件，确保此代码只在浏览器中运行
"use client";

// 导入已配置好的 i18next 实例
import i18next from "./index";
// 导入 Next.js 的 useParams hook，用于获取路由参数
import { useParams } from "next/navigation";
// 导入 React hooks，用于状态管理和副作用处理
import { useEffect, useState } from "react";
// 导入 react-i18next 的 useTranslation hook
import { useTranslation } from "react-i18next";

// 检测代码是否运行在服务器端
const runsOnServerSide = typeof window === "undefined";

// 导出客户端翻译 hook，用于在客户端组件中获取翻译函数
export function useT(ns: string | string[], options?: { keyPrefix?: string }) {
  // 从路由参数中获取语言标识符（来自 /app/[lng] 路由）
   const lng = useParams()?.lng;

  // 类型检查：确保 lng 是字符串类型，否则抛出错误
  if (typeof lng !== "string")
    throw new Error("useT is only available inside /app/[lng]");
  // 服务器端处理：如果在服务器端且语言不匹配，直接切换语言
  if (runsOnServerSide && i18next.resolvedLanguage !== lng) {
    i18next.changeLanguage(lng);
  } else {
    // 客户端处理：使用状态管理来跟踪活跃语言
    const [activeLng, setActiveLng] = useState(i18next.resolvedLanguage);
    // 监听 i18next 语言变化，同步更新本地状态
    useEffect(() => {
      // 如果活跃语言与 i18next 解析的语言相同，则无需更新
      if (activeLng === i18next.resolvedLanguage) return;
      // 更新本地活跃语言状态
      setActiveLng(i18next.resolvedLanguage);
    }, [activeLng, i18next.resolvedLanguage]);
    // 监听路由语言参数变化，切换 i18next 语言
    useEffect(() => {
      // 如果没有语言参数或语言已经匹配，则无需切换
      if (!lng || i18next.resolvedLanguage === lng) return;
      // 切换 i18next 的当前语言
      i18next.changeLanguage(lng);
    }, [lng, i18next]);
  }
  // 返回 react-i18next 的 useTranslation hook 结果
  return useTranslation(ns, options);
}
