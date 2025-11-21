/**
 * 复制操作的结果类型
 */
export interface CopyResult {
  success: boolean;
  error?: string;
}

/**
 * 复制选项配置
 */
export interface CopyOptions {
  /** 复制成功后的回调函数 */
  onSuccess?: () => void;
  /** 复制失败后的回调函数 */
  onError?: (error: string) => void;
  /** 是否在控制台输出错误信息 */
  logError?: boolean;
}

/**
 * 通用复制功能函数
 * 支持现代浏览器的 Clipboard API 和旧版浏览器的 execCommand 方法
 *
 * @param text - 要复制的文本内容
 * @param options - 复制选项配置
 * @returns Promise<CopyResult> - 复制操作的结果
 *
 * @example
 * ```typescript
 * // 基本用法
 * const result = await copyToClipboard('Hello World');
 * if (result.success) {
 *   console.log('复制成功');
 * }
 *
 * // 带回调函数的用法
 * await copyToClipboard('Hello World', {
 *   onSuccess: () => console.log('复制成功'),
 *   onError: (error) => console.error('复制失败:', error)
 * });
 * ```
 */
export async function copyToClipboard(
  text: string,
  options: CopyOptions = {}
): Promise<CopyResult> {
  const { onSuccess, onError, logError = true } = options;

  try {
    // 检查是否支持现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      onSuccess?.();
      return { success: true };
    }

    // 降级到 execCommand 方法（适用于旧版浏览器或非 HTTPS 环境）
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      onSuccess?.();
      return { success: true };
    } else {
      throw new Error("execCommand 复制失败");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";

    if (logError) {
      console.error("复制到剪贴板失败:", errorMessage);
    }

    onError?.(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 检查浏览器是否支持复制功能
 *
 * @returns boolean - 是否支持复制功能
 */
export function isCopySupported(): boolean {
  return !!(
    (navigator.clipboard && window.isSecureContext) ||
    document.queryCommandSupported?.("copy")
  );
}


/**
 * 下载操作的结果类型
 */
export interface DownloadResult {
  success: boolean;
  error?: string;
}

/**
 * 下载选项配置
 */
export interface DownloadOptions {
  /** 下载的文件名，如果不提供则从URL中提取 */
  filename?: string;
  /** 下载成功后的回调函数 */
  onSuccess?: () => void;
  /** 下载失败后的回调函数 */
  onError?: (error: string) => void;
  /** 是否在控制台输出错误信息 */
  logError?: boolean;
}



// 根据blob类型确定文件扩展名
const getFileExtension = (mimeType: string): string => {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
    'image/ico': '.ico',
    'image/x-icon': '.ico'
  };
  return mimeToExt[mimeType.toLowerCase()] || '.jpg'; // 默认为.jpg
};

/**
 * 下载图片函数
 * 通过创建临时的 a 标签来触发浏览器下载
 *
 * @param imageUrl - 图片的URL地址
 * @param options - 下载选项配置
 * @returns Promise<DownloadResult> - 下载操作的结果
 *
 * @example
 * ```typescript
 * // 基本用法
 * const result = await downloadImage('https://example.com/image.jpg');
 * if (result.success) {
 *   console.log('下载成功');
 * }
 *
 * // 指定文件名
 * await downloadImage('https://example.com/image.jpg', {
 *   filename: 'my-image.jpg',
 *   onSuccess: () => console.log('下载成功'),
 *   onError: (error) => console.error('下载失败:', error)
 * });
 * ```
 */
export async function downloadImage(
  imageUrl: string,
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const { filename, onSuccess, onError, logError = true } = options;

  try {
    // 获取图片数据
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // 创建临时URL
    const blobUrl = URL.createObjectURL(blob);

    // 创建临时下载链接
    const link = document.createElement('a');
    link.href = blobUrl;

    // 设置文件名并添加正确的扩展名
    const extension = getFileExtension(blob.type);

    if (filename) {
      // 移除原有扩展名（如果有的话）并添加正确的扩展名
      const nameWithoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, '');
      link.download = nameWithoutExt + extension;
    } else {
      // 从URL中提取文件名
      const urlParts = imageUrl.split('/');
      const urlFilename = urlParts[urlParts.length - 1];
      const cleanFilename = urlFilename.split('?')[0]; // 移除查询参数
      const nameWithoutExt = cleanFilename ? cleanFilename.replace(/\.[a-zA-Z0-9]+$/, '') : 'downloaded-image';
      link.download = nameWithoutExt + extension;
    }

    // 添加到DOM并触发点击
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    onSuccess?.();
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";

    if (logError) {
      console.error("下载图片失败:", errorMessage);
    }

    onError?.(errorMessage);
    return { success: false, error: errorMessage };
  }
}

