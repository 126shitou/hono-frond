import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * 创建Creem支付checkout session
 * POST /api/checkout
 * Body: { product_id: string, request_id?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please login first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { product_id, request_id } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: "product_id is required" },
        { status: 400 }
      );
    }

    // 检查环境变量
    const apiKey = process.env.CREEM_API_KEY;
    const apiEndpoint = process.env.CREEM_API_ENDPOINT!;

    if (!apiKey) {
      console.error("CREEM_API_KEY not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // 构建请求体
    const checkoutData: Record<string, any> = {
      product_id,
      success_url: process.env.NEXT_PUBLIC_SITE_URL + "/payment/success",
      request_id: `${session.user.email}_${Date.now()}`,
      metadata: {
        "userId": session.user.id,
      }
    };



    // 调用Creem API创建checkout session
    const response = await fetch(apiEndpoint + "/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Creem API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      checkout_url: data.checkout_url,
      checkout_id: data.checkout_id,
      request_id: checkoutData.request_id,
    });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

