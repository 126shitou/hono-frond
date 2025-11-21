const fs = require('fs');
const path = require('path');

/**
 * 获取 public 目录下所有文件名的脚本
 * 生成适合 middleware.ts 使用的 excludeFile 数组格式
 */
function getPublicFiles() {
  try {
    // 获取 public 目录的绝对路径
    const publicDir = path.join(__dirname, '..', 'public');
    
    // 检查 public 目录是否存在
    if (!fs.existsSync(publicDir)) {
      console.error('Public directory not found:', publicDir);
      return [];
    }

    // 读取目录内容
    const files = fs.readdirSync(publicDir);
    
    // 过滤出文件（排除子目录）
    const fileNames = files.filter(item => {
      const fullPath = path.join(publicDir, item);
      return fs.statSync(fullPath).isFile();
    });

    // 添加 sitemap.xml 和 robots.txt（这些文件由 Next.js 动态生成）
    const additionalFiles = ['sitemap.xml', 'robots.txt'];
    const allFiles = [...fileNames, ...additionalFiles];

    console.log('Public directory files found:', fileNames.length);
    console.log('Additional files added:', additionalFiles.length);
    console.log('Total files:', allFiles.length);
    console.log('Files:', allFiles.join(', '));
    
    return allFiles;
  } catch (error) {
    console.error('Error reading public directory:', error.message);
    return [];
  }
}

/**
 * 生成适合 middleware.ts 使用的 excludeFile 数组代码
 */
function generateExcludeFileArray() {
  const files = getPublicFiles();
  
  if (files.length === 0) {
    console.log('No files found in public directory.');
    return;
  }

  // 生成数组字符串，每行一个文件名，便于阅读和维护
  const arrayString = files.map(file => `  '${file}'`).join(',\n');
  
  console.log('\n=== 可直接复制到 middleware.ts 的 excludeFile 数组 ===');
  console.log(`const excludeFile = [\n${arrayString}\n]`);
  
  console.log('\n=== 单行格式（如果需要） ===');
  console.log(`const excludeFile = [${files.map(file => `'${file}'`).join(', ')}]`);
  
  return files;
}

// 如果直接运行此脚本，则执行函数
if (require.main === module) {
  generateExcludeFileArray();
}
 