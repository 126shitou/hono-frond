import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db, sql } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CreditPlan, SubscriptionPlan } from "@/lib/config/product";
import { customLog } from "@/lib/utils";

/**
 * Creem Webhook处理
 * POST /api/webhook
 */
export async function POST(request: NextRequest) {
    try {
        // 获取webhook secret
        const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("CREEM_WEBHOOK_SECRET not configured");
            return NextResponse.json(
                { error: "Webhook not configured" },
                { status: 500 }
            );
        }


        // 获取请求体
        const payload = await request.text();

        // 获取签名
        const signature = request.headers.get("creem-signature");

        if (!signature) {
            console.error("Missing creem-signature header");
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 400 }
            );
        }

        // 验证签名
        const isValid = verifyCreemSignature(payload, signature, webhookSecret);

        if (!isValid) {
            console.error("Invalid webhook signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // 解析webhook数据
        const webhookData = JSON.parse(payload);
        const { eventType } = webhookData;

        console.log(`++++++webhookData: ${payload} ++++++`);


        // 点击订阅触发事件流程 跳转支付界面=>subscription.activ=>subscription.paid=>checkout.completed
        // 点击购买触发事件流程 跳转支付界面=>checkout.completed
        // 根据事件类型处理
        switch (eventType) {
            // case "subscription.active":
            //     customLog("===========subscription.active===========");
            //     break;
            case "subscription.paid":
                customLog("===========subscription.paid===========");
                await handledSubscriptionPaid(webhookData);
                break;
            case "subscription.canceled":
                customLog("===========subscription.canceled===========");
                await handledSubscriptionCanceled(webhookData);
                break;
            // case "subscription.expired":
            //     customLog("===========subscription.expired===========");
            //     break;
            // case "subscription.update":
            //     customLog("===========subscription.update===========");
            //     break;
            // case "subscription.pause":
            //     customLog("===========subscription.pause===========");
            //     break;
            // case "subscription.trialing":
            //     customLog("===========subscription.trialing===========");
            //     break;



            case "checkout.completed":
                customLog("===========checkout.completed===========");
                await handledCheckoutCompleted(webhookData);
                break;
            // case "refund.created":
            //     customLog("===========refund.created===========");
            //     break;

            // case "dispute.created":
            //     customLog("===========dispute.created===========");
            //     break;

            default:
                customLog(`===========Unhandled event type: ${eventType}===========`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


/**
 * 验证Creem webhook签名
 */
function verifyCreemSignature(payload: string, signature: string, secret: string): boolean {
    const computedSignature = createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
    return computedSignature === signature;
}

/**
 * 返回数据示例
 * {
  "id": "evt_4hQ3Ah3N9JIiPTO9zuYLOJ",
  "eventType": "subscription.paid",
  "created_at": 1762491924645,
  "object": {
    "id": "sub_1WvNHsUebgq61G3tOl1rqv",
      "object": "subscription",
      "product": {
      "id": "prod_2dJ1ygBDbBrzBkwl4CjNMr",
      "object": "product",
      "name": "10刀乐-订阅",
      "description": "10刀乐-订阅",
      "price": 1000,
      "currency": "USD",
          "billing_type": "recurring",
          "billing_period": "every-month",
          "status": "active",
      "tax_mode": "exclusive",
          "tax_category": "saas",
      "default_success_url": null,
      "created_at": "2025-11-05T09:37:48.749Z",
      "updated_at": "2025-11-05T09:37:48.749Z",
      "mode": "test"
      },
      "customer": {
      "id": "cust_RHQC0NXPMtpqW1hcTFNAj",
          "object": "customer",
      "email": "ui@example.com",
      "name": "test",
      "country": "SG",
      "created_at": "2025-11-05T10:45:53.515Z",
      "updated_at": "2025-11-05T10:45:53.515Z",
      "mode": "test"
    },
    "items": [
      {
        "object": "subscription_item",
        "id": "sitem_ysWCgekjrIgPZxQejWREO",
        "product_id": "prod_2dJ1ygBDbBrzBkwl4CjNMr",
        "price_id": "pprice_1RFrMGTaHqLXhDWpGlCvm8",
        "units": 1,
        "created_at": "2025-11-07T05:05:14.391Z",
        "updated_at": "2025-11-07T05:05:14.391Z",
        "mode": "test"
      }
    ],
      "collection_method": "charge_automatically",
      "status": "active",
    "last_transaction_id": "tran_2PM3lzQai6njhBxnS8vHPB",
    "last_transaction": {
      "id": "tran_2PM3lzQai6njhBxnS8vHPB",
      "object": "transaction",
      "amount": 1000,
      "amount_paid": 1000,
      "currency": "USD",
      "type": "invoice",
      "tax_country": "SG",
      "tax_amount": 0,
      "status": "paid",
      "refunded_amount": null,
      "order": "ord_2RSf8iwyv8maTBOYmvVQNp",
      "subscription": "sub_1WvNHsUebgq61G3tOl1rqv",
      "customer": null,
      "description": "Subscription payment",
      "period_start": 1762491909000,
      "period_end": 1765083909000,
      "created_at": 1762491918812,
      "mode": "test"
    },
    "last_transaction_date": "2025-11-07T05:05:09.000Z",
    "next_transaction_date": "2025-12-07T05:05:09.000Z",
    "current_period_start_date": "2025-11-07T05:05:09.000Z",
    "current_period_end_date": "2025-12-07T05:05:09.000Z",
    "canceled_at": null,
    "created_at": "2025-11-07T05:05:14.378Z",
    "updated_at": "2025-11-07T05:05:20.626Z",
    "mode": "test"
  }
}
 */

async function handledSubscriptionPaid(webhookData: any) {
    try {
        const subscription = webhookData.object;
        const productId = subscription.product.id;
        const customer = subscription.customer;
        const metadata = subscription.metadata || {};

        // 查找产品配置
        const product = SubscriptionPlan.find(p => p.productId === productId);
        if (!product) {
            console.error(`Product not found: ${productId}`);
            return;
        }

        // 优化：并行查询用户和检查订单（减少往返次数）
        const userId = metadata.userId || metadata.internal_customer_id;

        // 并行执行用户查询和幂等性检查
        const [userByIdResult, userByEmailResult, existingOrderResult] = await Promise.all([
            userId ? db.select().from(users).where(eq(users.sid, userId)).limit(1) : Promise.resolve([]),
            db.select().from(users).where(eq(users.email, customer.email)).limit(1),
            db.select().from(orders).where(eq(orders.transactionId, subscription.last_transaction_id)).limit(1)
        ]);

        // 优先使用 userId 查找结果
        const user = userByIdResult[0] || userByEmailResult[0];

        if (!user) {
            console.error(`User not found. userId: ${userId}, email: ${customer.email}`);
            return;
        }

        if (existingOrderResult[0]) {
            customLog(`Order already processed: ${subscription.last_transaction_id}`);
            return;
        }

        customLog(`Processing subscription payment for user: ${user.email} (${user.sid})`);
        customLog(`User found by: ${userByIdResult[0] ? 'userId' : 'email'}`);

        // 解析订阅周期
        const billingPeriod = subscription.product.billing_period;
        const subscriptionInterval = billingPeriod === "every-month" ? "monthly" : "yearly";

        const subscriptionType = product.type;

        customLog(`Subscription type determined: ${subscriptionType}`);

        // 解析日期
        const currentPeriodStart = new Date(subscription.current_period_start_date);
        const currentPeriodEnd = new Date(subscription.current_period_end_date);
        const paidAt = new Date(subscription.last_transaction_date);

        // 1. 创建订单记录
        const [newOrder] = await db
            .insert(orders)
            .values({
                userId: user.sid,
                orderType: "subscription",
                amount: (subscription.product.price / 100).toString(), // 转换为元
                currency: subscription.product.currency,
                status: "completed",
                paymentProvider: "creeem",
                paymentIntentId: subscription.id,
                transactionId: subscription.last_transaction_id,
                customerId: customer.id,
                customerEmail: customer.email,
                customerName: customer.name,
                customerCountry: customer.country,
                subscriptionType: subscriptionType,
                subscriptionInterval: subscriptionInterval,
                subscriptionStartDate: currentPeriodStart,
                subscriptionEndDate: currentPeriodEnd,
                description: `使用邮箱${customer.email} 订阅支付: ${product.productId}`,
                metadata: JSON.stringify(webhookData),
                paidAt: paidAt,
                updatedAt: new Date(),
            })
            .returning();

        customLog(`Created order: ${newOrder.orderNo}`);

        // 2. 判断是首次订阅还是续费
        const isFirstSubscription = user.subscriptionType === "free" || !user.subscriptionsEndDate;
        const action = isFirstSubscription ? "new" : "renew";

        // 计算新的积分值
        const newMembershipPoints = user.membershipPoints + product.points;
        const newTotalPoints = user.totalPoints + product.points;

        // 3. 使用事务确保所有更新的原子性（3个操作 → 1次往返 + 事务保证）
        await sql.transaction([
            // 更新用户（订阅信息 + 积分）
            sql`
                UPDATE users 
                SET 
                    subscription_type = ${subscriptionType}::subscription_type,
                    subscriptions_start_date = ${currentPeriodStart},
                    subscriptions_end_date = ${currentPeriodEnd},
                    membership_points = ${newMembershipPoints},
                    total_points = ${newTotalPoints},
                    updated_at = NOW()
                WHERE sid = ${user.sid}
            `,

            // 创建订阅历史
            sql`
                INSERT INTO subscription_history 
                    (user_id, order_id, subscription_type, subscription_interval, start_date, end_date, action, created_at)
                VALUES 
                    (${user.sid}, ${newOrder.id}, ${subscriptionType}, ${subscriptionInterval}::subscription_interval, 
                     ${currentPeriodStart}, ${currentPeriodEnd}, ${action}, NOW())
            `,

            // 创建积分历史
            sql`
                INSERT INTO points_history 
                    (sid, action, points, order_id, points_detail, created_at, updated_at)
                VALUES 
                    (${user.sid}, 'purchase', ${product.points}, ${newOrder.id}, ${{ membership: product.points }}, NOW(), NOW())
            `
        ]);

        customLog(`Transaction completed: subscription=${subscriptionType}, points=+${product.points}, history=${action}`);


        customLog("✅ Subscription payment processed successfully");
    } catch (error) {
        console.error("Error handling subscription paid:", error);
        throw error;
    }
}


/**
 * 
{
  "id": "evt_6FGMfiLLLIfHiwoejZtl9Y",
  "eventType": "checkout.completed",
  "created_at": 1762495836243,
  "object": {
    "id": "ch_5JbuQk9Jd65yDyQnKwufa0",
    "object": "checkout",
    "request_id": "hebeidianxin2945@gmail.com_1762495797075",
    "order": {
      "object": "order",
      "id": "ord_5i4o2XEhelmrcWARPEvik0",
      "customer": "cust_RHQC0NXPMtpqW1hcTFNAj",
      "product": "prod_5EVAPTqzLC7CRKMLWffrCX",
      "amount": 1000,
      "currency": "USD",
      "sub_total": 1000,
      "tax_amount": 0,
      "amount_due": 1000,
      "amount_paid": 1000,
      "status": "paid",
      "type": "onetime",
      "transaction": "tran_5AXJhtADOMI9m3LghKrHIQ",
      "created_at": "2025-11-07T06:10:06.796Z",
      "updated_at": "2025-11-07T06:10:06.796Z",
      "mode": "test"
    },
    "product": {
      "id": "prod_5EVAPTqzLC7CRKMLWffrCX",
      "object": "product",
      "name": "10刀乐积分",
      "description": "testtesttest",
      "price": 1000,
      "currency": "USD",
      "billing_type": "onetime",
      "billing_period": "once",
      "status": "active",
      "tax_mode": "exclusive",
      "tax_category": "saas",
      "default_success_url": "http://localhost:3000/success",
      "created_at": "2025-11-05T09:39:29.007Z",
      "updated_at": "2025-11-05T09:39:29.007Z",
      "mode": "test"
    },
    "units": 1,
    "success_url": "http://localhost:3000/payment/success",
    "customer": {
      "id": "cust_RHQC0NXPMtpqW1hcTFNAj",
      "object": "customer",
      "email": "ui@example.com",
      "name": "test",
      "country": "SG",
      "created_at": "2025-11-05T10:45:53.515Z",
      "updated_at": "2025-11-05T10:45:53.515Z",
      "mode": "test"
    },
    "status": "completed",
    "metadata": {
      "userId": "9MkPgpeCl4RdHxyCIN0sa"
    },
    "mode": "test"
  }
}
 * 
 * 
 * 
 */

/**
 * 处理 checkout.completed 事件
 * 
 * 注意：订阅和一次性购买都会触发此事件
 * - 订阅类型：在 subscription.paid 中已处理，这里跳过
 * - 一次性购买：在这里处理积分发放
 */
async function handledCheckoutCompleted(webhookData: any) {
    try {
        const checkout = webhookData.object;
        const order = checkout.order;
        const productId = checkout.product.id;
        const customer = checkout.customer;
        const metadata = checkout.metadata || {};

        // 查找产品配置
        const product = [...CreditPlan, ...SubscriptionPlan].find(p => p.productId === productId);
        if (!product) {
            console.error(`Product not found: ${productId}`);
            return;
        }

        // 判断订单类型
        const orderType = order.type; // "onetime" 或 "recurring"
        const billingType = checkout.product.billing_type; // "onetime" 或 "recurring"

        customLog(`Checkout completed - orderType: ${orderType}, billingType: ${billingType}`);

        // 如果是订阅类型，跳过（在 subscription.paid 中处理）
        if (orderType === "recurring" || billingType === "recurring" || product.productType === "subscription") {
            customLog("Subscription order - skipped (handled in subscription.paid)");
            return;
        }

        // 一次性购买积分 - 执行积分发放逻辑
        if (orderType === "onetime" || billingType === "onetime" || product.productType === "once") {
            customLog("Onetime purchase - processing credits");
            await handledOnetimePayment(product, customer, order, metadata, webhookData);
            return;
        }

        customLog(`Unknown order type: ${orderType}, skipped`);
    } catch (error) {
        console.error("Error handling checkout completed:", error);
        throw error;
    }
}

/**
 * 处理一次性购买积分
 * 
 * 性能优化：
 * 1. 并行查询用户和幂等性检查
 * 2. 使用事务确保积分发放的原子性
 */
async function handledOnetimePayment(
    product: any,
    customer: any,
    order: any,
    metadata: any,
    webhookData: any
) {
    try {
        const userId = metadata.userId || metadata.internal_customer_id;
        const transactionId = order.transaction;

        // 并行查询用户和幂等性检查
        const [userByIdResult, userByEmailResult, existingOrderResult] = await Promise.all([
            userId ? db.select().from(users).where(eq(users.sid, userId)).limit(1) : Promise.resolve([]),
            db.select().from(users).where(eq(users.email, customer.email)).limit(1),
            db.select().from(orders).where(eq(orders.transactionId, transactionId)).limit(1)
        ]);

        // 优先使用 userId 查找结果
        const user = userByIdResult[0] || userByEmailResult[0];

        if (!user) {
            console.error(`User not found. userId: ${userId}, email: ${customer.email}`);
            return;
        }

        if (existingOrderResult[0]) {
            customLog(`Order already processed: ${transactionId}`);
            return;
        }

        customLog(`Processing onetime payment for user: ${user.email} (${user.sid})`);
        customLog(`User found by: ${userByIdResult[0] ? 'userId' : 'email'}`);

        // 解析日期
        const paidAt = new Date(order.created_at);

        // 1. 创建订单记录
        const [newOrder] = await db
            .insert(orders)
            .values({
                userId: user.sid,
                orderType: "credits",
                amount: (order.amount / 100).toString(),
                currency: order.currency,
                status: "completed",
                paymentProvider: "creeem",
                paymentIntentId: order.id,
                transactionId: transactionId,
                customerId: customer.id,
                customerEmail: customer.email,
                customerName: customer.name,
                customerCountry: customer.country,
                creditsAmount: product.points,
                description: `积分购买: ${product.name}`,
                metadata: JSON.stringify(webhookData),
                paidAt: paidAt,
                updatedAt: new Date(),
            })
            .returning();

        customLog(`Created order: ${newOrder.orderNo}`);

        // 计算新的积分值
        const newTopupPoints = user.topupPoints + product.points;
        const newTotalPoints = user.totalPoints + product.points;

        // 2. 使用事务确保积分发放的原子性
        await sql.transaction([
            // 更新用户积分（充值积分）
            sql`
                UPDATE users 
                SET 
                    topup_points = ${newTopupPoints},
                    total_points = ${newTotalPoints},
                    updated_at = NOW()
                WHERE sid = ${user.sid}
            `,

            // 创建积分历史记录
            sql`
                INSERT INTO points_history 
                    (sid, action, points, order_id, points_detail, created_at, updated_at)
                VALUES 
                    (${user.sid}, 'purchase', ${product.points}, ${newOrder.id}, ${{ topup: product.points }}, NOW(), NOW())
            `
        ]);

        customLog(`Transaction completed: topup_points=+${product.points}, total=+${product.points}`);
        customLog("✅ Onetime payment processed successfully");
    } catch (error) {
        console.error("Error handling onetime payment:", error);
        throw error;
    }
}



/**
 * 订阅取消事件
{
  "id": "evt_plPqFFoNcHsfL88Ekhv4o",
  "eventType": "subscription.canceled",
  "created_at": 1762497573776,
  "object": {
    "id": "sub_2mGqyKf4lcVeZ3FjaTfBhP",
    "object": "subscription",
    "product": {
      "id": "prod_2dJ1ygBDbBrzBkwl4CjNMr",
      "object": "product",
      "name": "10刀乐-订阅",
      "description": "10刀乐-订阅",
      "price": 1000,
      "currency": "USD",
      "billing_type": "recurring",
      "billing_period": "every-month",
      "status": "active",
      "tax_mode": "exclusive",
      "tax_category": "saas",
      "default_success_url": null,
      "created_at": "2025-11-05T09:37:48.749Z",
      "updated_at": "2025-11-05T09:37:48.749Z",
      "mode": "test"
    },
    "customer": {
      "id": "cust_RHQC0NXPMtpqW1hcTFNAj",
      "object": "customer",
      "email": "ui@example.com",
      "name": "10刀乐-订阅",
      "country": "SG",
      "created_at": "2025-11-05T10:45:53.515Z",
      "updated_at": "2025-11-05T10:45:53.515Z",
      "mode": "test"
    },
    "items": [
      {
        "object": "subscription_item",
        "id": "sitem_1PbxlH0Vbz0YA1RPnUX7Ml",
        "product_id": "prod_2dJ1ygBDbBrzBkwl4CjNMr",
        "price_id": "pprice_1RFrMGTaHqLXhDWpGlCvm8",
        "units": 1,
        "created_at": "2025-11-07T06:26:34.716Z",
        "updated_at": "2025-11-07T06:26:34.716Z",
        "mode": "test"
      }
    ],
    "collection_method": "charge_automatically",
    "status": "canceled",
    "last_transaction_id": "tran_1xpIvJ0YOnXRb66McF39g1",
    "last_transaction": {
      "id": "tran_1xpIvJ0YOnXRb66McF39g1",
      "object": "transaction",
      "amount": 1000,
      "amount_paid": 1000,
      "currency": "USD",
      "type": "invoice",
      "tax_country": "SG",
      "tax_amount": 0,
      "status": "paid",
      "refunded_amount": null,
      "order": "ord_2ZK3Ockkq6pqEdqFgBduf1",
      "subscription": "sub_2mGqyKf4lcVeZ3FjaTfBhP",
      "customer": null,
      "description": "Subscription payment",
      "period_start": 1762496789000,
      "period_end": 1765088789000,
      "created_at": 1762496799936,
      "mode": "test"
    },
    "last_transaction_date": "2025-11-07T06:26:29.000Z",
    "current_period_start_date": "2025-11-07T06:26:29.000Z",
    "current_period_end_date": "2025-12-07T06:26:29.000Z",
    "canceled_at": "2025-11-07T06:39:31.864Z",
    "created_at": "2025-11-07T06:26:34.705Z",
    "updated_at": "2025-11-07T06:39:31.955Z",
    "metadata": {
      "userId": "9MkPgpeCl4RdHxyCIN0sa"
    },
    "mode": "test"
  }
} */

/**
 * 处理订阅取消事件
 * 
 * 功能：
 * 1. 将用户订阅类型改回 "free"
 * 2. 清除订阅日期
 * 3. 创建订阅历史记录（action: "cancel"）
 * 4. 注意：已发放的积分保留，不扣除
 */
async function handledSubscriptionCanceled(webhookData: any) {
    try {
        const subscription = webhookData.object;
        const customer = subscription.customer;
        const metadata = subscription.metadata || {};
        const canceledAt = new Date(subscription.canceled_at);

        customLog(`Processing subscription cancellation at: ${canceledAt.toISOString()}`);

        // 查找用户（优先 userId，备用 email）
        const userId = metadata.userId || metadata.internal_customer_id;
        const [userByIdResult, userByEmailResult] = await Promise.all([
            userId ? db.select().from(users).where(eq(users.sid, userId)).limit(1) : Promise.resolve([]),
            db.select().from(users).where(eq(users.email, customer.email)).limit(1)
        ]);

        const user = userByIdResult[0] || userByEmailResult[0];

        if (!user) {
            console.error(`User not found. userId: ${userId}, email: ${customer.email}`);
            return;
        }

        customLog(`Processing cancellation for user: ${user.email} (${user.sid})`);
        customLog(`User found by: ${userByIdResult[0] ? 'userId' : 'email'}`);
        customLog(`Current subscription: ${user.subscriptionType}`);

        // 如果用户已经是 free 用户，跳过
        if (user.subscriptionType === "free") {
            customLog("User already free, skipping");
            return;
        }

        // 获取当前订阅信息（用于历史记录）
        const previousSubscriptionType = user.subscriptionType;
        const previousEndDate = user.subscriptionsEndDate;

        // 使用事务更新用户状态和创建历史记录
        await sql.transaction([
            // 1. 更新用户订阅状态为 free
            sql`
                UPDATE users 
                SET 
                    subscription_type = 'free'::subscription_type,
                    subscriptions_start_date = NULL,
                    subscriptions_end_date = NULL,
                    updated_at = NOW()
                WHERE sid = ${user.sid}
            `,

            // 2. 创建订阅历史记录
            sql`
                INSERT INTO subscription_history 
                    (user_id, subscription_type, subscription_interval, start_date, end_date, action, created_at)
                VALUES 
                    (${user.sid}, ${previousSubscriptionType}, NULL, 
                     ${user.subscriptionsStartDate}, ${previousEndDate}, 'cancel', NOW())
            `
        ]);

        customLog(`Subscription canceled: ${previousSubscriptionType} -> free`);
        customLog("✅ Subscription cancellation processed successfully");
    } catch (error) {
        console.error("Error handling subscription canceled:", error);
        throw error;
    }
}