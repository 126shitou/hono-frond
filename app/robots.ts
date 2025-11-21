import type { MetadataRoute } from "next";
import { languages } from "@/i18n/setting";
/**
 * Robots.txt 配置
 * 用于指导搜索引擎爬虫如何抓取网站内容
 * 提升SEO效果，保护敏感路径
 */
export default function robots(): MetadataRoute.Robots {
  // 根据环境设置基础URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const disallowWithLang = languages.map((item) => `/${item}/creations`);
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/creations", "/api", "/.well-known", ...disallowWithLang,],
        allow: "/",
      },
    ],
    // 指向sitemap的URL
    sitemap: `${baseUrl}/sitemap.xml`,
    // 网站主机信息（可选）
    host: baseUrl,
  };
}
