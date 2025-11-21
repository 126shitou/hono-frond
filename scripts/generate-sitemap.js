const fs = require('fs');
const path = require('path');

// 配置项
const config = {
    // 网站基础URL
    baseUrl: 'https://geminiimagegenerator.online',

    // 支持的语言列表
    languages: ["en", "zh", "da", "de", "es", "fr", "id", "it", "ja", "ko", "nb", "nl", "vi", "pl", "pt", "ru", "th", "tr", "tw"],

    // 默认语言
    defaultLanguage: 'en',

    // 输出文件路径
    outputPath: path.join(__dirname, '../app/sitemap.xml'),

    // URL配置
    urls: [
        {
            path: '/',
            lastmod: new Date('2025-11-2 11:17:13').toISOString(),
            changefreq: 'daily',
            priority: 1.0
        },
    ]
};

/**
 * 生成hreflang链接
 * @param {string} urlPath - URL路径
 * @returns {string} - hreflang链接XML
 */
function generateHrefLangLinks(urlPath) {
    let links = '';

    // 添加默认语言链接 (x-default) - 默认语言不加语言路径
    const defaultUrl = urlPath === '/' ? config.baseUrl : `${config.baseUrl}${urlPath}`;
    links += `<xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}" />\n`;

    // 为每种语言生成链接
    config.languages.forEach(lang => {
        let langUrl;
        if (lang === config.defaultLanguage) {
            // 默认语言不加语言路径
            langUrl = urlPath === '/' ? config.baseUrl : `${config.baseUrl}${urlPath}`;
        } else {
            // 非默认语言加语言路径，确保路径结尾不带斜杠
            const cleanPath = urlPath === '/' ? '' : urlPath;
            langUrl = `${config.baseUrl}/${lang}${cleanPath}`;
        }
        links += `<xhtml:link rel="alternate" hreflang="${lang}" href="${langUrl}" />\n`;
    });

    return links;
}

/**
 * 生成单个URL条目
 * @param {string} url - 完整URL
 * @param {string} urlPath - URL路径（用于生成hreflang）
 * @param {string} lastmod - 最后修改时间
 * @param {string} changefreq - 更新频率
 * @param {number} priority - 优先级
 * @returns {string} - URL条目XML
 */
function generateUrlEntry(url, urlPath, lastmod, changefreq, priority = null) {
    let entry = '<url>\n';
    entry += `<loc>${url}</loc>\n`;
    entry += generateHrefLangLinks(urlPath);
    entry += `<lastmod>${lastmod}</lastmod>\n`;
    entry += `<changefreq>${changefreq}</changefreq>\n`;
    if (priority !== null) {
        entry += `<priority>${priority}</priority>\n`;
    }
    entry += '</url>\n';
    return entry;
}

/**
 * 生成sitemap XML内容
 * @returns {string} - 完整的sitemap XML
 */
function generateSitemap() {
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="https://www.w3.org/1999/xhtml">\n';

    // 生成每个URL的条目
    config.urls.forEach(urlConfig => {
        const urlPath = urlConfig.path;

        // 为每种语言生成对应的URL条目
        config.languages.forEach(lang => {
            let langUrl;
            if (lang === config.defaultLanguage) {
                // 默认语言不加语言路径
                langUrl = urlPath === '/' ? config.baseUrl : `${config.baseUrl}${urlPath}`;
            } else {
                // 非默认语言加语言路径，确保路径结尾不带斜杠
                const cleanPath = urlPath === '/' ? '' : urlPath;
                langUrl = `${config.baseUrl}/${lang}${cleanPath}`;
            }
            sitemap += generateUrlEntry(langUrl, urlPath, urlConfig.lastmod, urlConfig.changefreq, urlConfig.priority);
        });
    });

    sitemap += '</urlset>';
    return sitemap;
}

/**
 * 写入sitemap文件
 * @param {string} content - sitemap内容
 */
function writeSitemapFile(content) {
    try {
        // 确保目录存在
        const dir = path.dirname(config.outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 写入文件
        fs.writeFileSync(config.outputPath, content, 'utf8');
        console.log(`✅ Sitemap generated successfully: ${config.outputPath}`);
        console.log(`📊 Generated ${config.urls.length * config.languages.length} URLs`);
    } catch (error) {
        console.error('❌ Error writing sitemap file:', error);
        process.exit(1);
    }
}

/**
 * 主函数
 */
function main() {
    console.log('🚀 Generating sitemap...');
    console.log(`📍 Base URL: ${config.baseUrl}`);
    console.log(`🌍 Languages: ${config.languages.join(', ')}`);
    console.log(`📄 URLs: ${config.urls.length}`);

    const sitemapContent = generateSitemap();
    writeSitemapFile(sitemapContent);
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}
