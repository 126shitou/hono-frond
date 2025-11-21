/**
 * 
 * @param code 语言代码 code: en  fr  zh tw 等
 * @param path 路径  ""  pricing  creationgs  pricing/test等
 * @returns 语言代码 en: /pricing、/   fr: /fr/pricing、 /fr/creationgs、/fr/creationgs/test等
 */
import { defaultLng } from "@/i18n/setting";

export default function getLngCode(code?: string, path?: string, isLink = true): string {

    if (!code) code = defaultLng
    if (!path) path = "/"

    // 清理路径，移除开头和结尾的斜杠
    const cleanPath = path.replace(/^\/+|\/+$/g, '');

    // 如果是默认语言（en）
    if (code === defaultLng) {
        // 如果路径为空，返回首页
        if (!cleanPath) {
            return isLink ? '/' : '';
        }
        // 否则返回路径，前面加斜杠
        return `/${cleanPath}`;
    }

    // 非默认语言
    if (!cleanPath) {
        // 如果路径为空，返回语言代码路径
        return `/${code}`;
    }

    // 返回带语言代码的路径
    return `/${code}/${cleanPath}`;
}