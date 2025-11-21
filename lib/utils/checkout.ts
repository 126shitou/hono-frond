/**
 * 支付相关工具函数
 */

export interface CheckoutOptions {
  productId: string;
  /** 是否自动跳转到支付页面，默认为 true */
  autoRedirect?: boolean;
  onLoading?: () => void;
  onSuccess?: (data: CheckoutResponse) => void;
  onError?: (error: Error) => void;
}

export interface CheckoutResponse {
  checkout_url: string;
  checkout_id: string;
  request_id: string;
}

/**
 * 创建支付会话并跳转到支付页面
 * @param options 配置选项
 * @returns Promise<CheckoutResponse>
 */
export async function createCheckoutSession(
  options: CheckoutOptions
): Promise<CheckoutResponse> {
  const { productId, autoRedirect = true, onLoading, onSuccess, onError } = options;

  try {
    // 调用加载回调
    onLoading?.();

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "创建支付会话失败");
    }

    const data = await response.json();

    // 调用成功回调
    onSuccess?.(data);

    // 自动跳转到支付页面
    if (autoRedirect && data.checkout_url) {
      window.location.href = data.checkout_url;
    }

    return data;
  } catch (err: any) {
    const error = new Error(err.message || "支付失败，请重试");
    // 调用错误回调
    onError?.(error);
    throw error;
  }
}

