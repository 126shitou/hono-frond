const { AwsClient } = require("aws4fetch");
const fs = require("fs");
const glob = require("glob");
const crypto = require("crypto");

const client = new AwsClient({
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    region: "auto",
    service: "s3",
});

const S3_URL = process.env.CLOUDFLARE_S3_URL;

async function clearOldFiles() {
    console.log("🧹 开始清除旧的静态资源...");

    try {
        // 列出所有 prod/ 目录下的文件
        const listUrl = `${S3_URL}?prefix=prod/&list-type=2`;
        const response = await client.fetch(listUrl, {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`列出文件失败: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();

        // 解析XML响应，提取文件键名
        const keyRegex = /<Key>([^<]+)<\/Key>/g;
        const keys = [];
        let match;
        while ((match = keyRegex.exec(xmlText)) !== null) {
            keys.push(match[1]);
        }

        console.log(`找到 ${keys.length} 个旧文件需要删除`);

        // 批量删除文件
        if (keys.length > 0) {
            await deleteFiles(keys);
        }

        console.log("✅ 旧文件清除完成");
    } catch (error) {
        console.error("❌ 清除旧文件时出错:", error.message);
        throw error;
    }
}

async function deleteFiles(keys) {
    // 构建批量删除的XML请求体
    const deleteXml = `<?xml version="1.0" encoding="UTF-8"?>
<Delete>
  ${keys.map(key => `<Object><Key>${key}</Key></Object>`).join('')}
</Delete>`;

    const deleteUrl = `${S3_URL}?delete`;

    try {
        const response = await client.fetch(deleteUrl, {
            method: "POST",
            body: deleteXml,
            headers: {
                "Content-Type": "application/xml",
                "Content-MD5": crypto.createHash('md5').update(deleteXml).digest('base64'),
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`批量删除失败: ${response.status} ${response.statusText} - ${errorText}`);
        }

        console.log(`✅ 成功删除 ${keys.length} 个旧文件`);
    } catch (error) {
        console.error("❌ 批量删除文件失败:", error.message);
        throw error;
    }
}

async function uploadStatic() {
    // 先清除旧的静态资源
    await clearOldFiles();

    // 使用 glob 查找 .open-next/assets 下的所有文件
    const staticFiles = glob.sync(".open-next/assets/**/*", { nodir: true });

    console.log(
        `找到 ${staticFiles.length} 个 .next/static 文件，开始上传到 /prod 路径...`
    );

    // 处理 .open-next/assets 下的文件（生成后的 _next 及根资源）
    for (const file of staticFiles) {
        // 统一分隔符为 /，然后去掉 .open-next/assets/ 前缀
        const normalized = file.replace(/\\/g, "/");
        const relativePath = normalized.replace(/^\.open-next\/assets\//, "");
        // 保持与页面引用一致：prod/_next/... 或 prod/<root-file>
        const key = `prod/${relativePath}`;

        console.log(`静态文件路径映射: ${file} -> ${key}`);

        await uploadFile(file, key);
    }



    console.log("🎉 所有静态资源上传完成！");
}

async function uploadFile(file, key) {
    const body = fs.readFileSync(file);
    const url = `${S3_URL}/${key}`;

    try {
        const response = await client.fetch(url, {
            method: "PUT",
            body: body,
            headers: {
                "Content-Type": getContentType(file),
                "Content-Length": body.length.toString(),
                // 设置缓存策略，静态资源长期缓存
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

        if (response.ok) {
            console.log(`✅ Uploaded: ${key}`);
        } else {
            const errorText = await response.text();
            console.error(
                `❌ Upload failed: ${key} - ${response.status} ${response.statusText}`
            );
            console.error(`Error details: ${errorText}`);
            throw new Error(`Upload failed for ${key}`);
        }
    } catch (error) {
        console.error(`❌ Error uploading ${key}:`, error.message);
        throw error;
    }
}

function getContentType(filename) {
    if (filename.endsWith(".js")) return "application/javascript";
    if (filename.endsWith(".mjs")) return "application/javascript";
    if (filename.endsWith(".css")) return "text/css";
    if (filename.endsWith(".woff2")) return "font/woff2";
    if (filename.endsWith(".woff")) return "font/woff";
    if (filename.endsWith(".ttf")) return "font/ttf";
    if (filename.endsWith(".png")) return "image/png";
    if (filename.endsWith(".jpg")) return "image/jpeg";
    if (filename.endsWith(".jpeg")) return "image/jpeg";
    if (filename.endsWith(".gif")) return "image/gif";
    if (filename.endsWith(".svg")) return "image/svg+xml";
    if (filename.endsWith(".webp")) return "image/webp";
    if (filename.endsWith(".ico")) return "image/x-icon";
    if (filename.endsWith(".json")) return "application/json";
    return "application/octet-stream";
}

uploadStatic().catch(console.error);
