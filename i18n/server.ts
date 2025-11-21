// 导入已配置好的 i18next 实例（包含客户端和服务器端配置）
import i18next from "./index";
// 导入 HTTP 头部名称常量，用于从请求头中获取语言信息
import { headerName } from "./setting";
// 导入 Next.js 的 headers 函数，用于在服务器组件中获取请求头
import { headers } from "next/headers";

// 导出异步函数 getT，用于在服务器端获取翻译函数
export async function getT(
  // ns: 命名空间参数，可以是单个字符串或字符串数组，指定要加载的翻译文件
  ns: string | string[],
  // options: 可选配置对象，包含 keyPrefix 用于为翻译键添加前缀
  options?: { keyPrefix?: string }
) {
  // 获取当前请求的所有 HTTP 头部信息
  const headerList = await headers();
  // 从请求头中提取语言标识符（通常由 middleware 设置）
  const lng = headerList.get(headerName);
  // 如果检测到语言且与当前 i18next 解析的语言不同，则切换语言
  if (lng && i18next.resolvedLanguage !== lng) {
    // 异步切换 i18next 的当前语言，这会触发相应语言资源的加载
    await i18next.changeLanguage(lng);
  }
  // 检查指定的命名空间是否已加载，如果未加载则进行加载
  if (ns && !i18next.hasLoadedNamespace(ns)) {
    // 异步加载指定的命名空间翻译资源
    await i18next.loadNamespaces(ns);
  }
  // 返回包含翻译函数和 i18next 实例的对象
  return {
    // t: 创建一个固定语言和命名空间的翻译函数
    t: i18next.getFixedT(
      // 使用检测到的语言或当前解析的语言
      lng ?? (i18next.resolvedLanguage as string),
      // 如果 ns 是数组则取第一个，否则直接使用
      Array.isArray(ns) ? ns[0] : ns,
      // 传递可选的键前缀配置
      options?.keyPrefix
    ),
    // i18n: 返回 i18next 实例，供调用者进行更高级的操作
    i18n: i18next,
  };
}
