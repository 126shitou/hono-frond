import {
    pgTable,
    varchar,
    integer,
    timestamp,
    pgEnum,
    serial,
    decimal,
    text,
    index,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { nanoid } from "nanoid";

// 订单类型枚举值（导出供应用层使用）
export const orderTypeValues = [
    "subscription",  // 订阅
    "credits",       // 积分购买
] as const;

// 订单类型枚举（数据库层）
export const orderTypeEnum = pgEnum("order_type", orderTypeValues as unknown as [string, ...string[]]);

// 订单状态枚举值（导出供应用层使用）
export const orderStatusValues = [
    "pending",       // 待支付
    "processing",    // 处理中
    "completed",     // 已完成
    "failed",        // 失败
    "cancelled",     // 已取消
    "refunded",      // 已退款
] as const;

// 订单状态枚举（数据库层）
export const orderStatusEnum = pgEnum("order_status", orderStatusValues as unknown as [string, ...string[]]);

// 订阅周期枚举值（导出供应用层使用）
export const subscriptionIntervalValues = [
    "monthly",  // 月度
    "yearly",   // 年度
] as const;

// 订阅周期枚举（数据库层）
export const subscriptionIntervalEnum = pgEnum("subscription_interval", subscriptionIntervalValues as unknown as [string, ...string[]]);

// 订单表
export const orders = pgTable("orders", {
    // id不可对外暴露
    id: serial("id").primaryKey(),
    orderNo: varchar("order_no", { length: 50 })
        .unique()
        .notNull()
        .$defaultFn(() => `ORD-${Date.now()}-${nanoid(8)}`), // 订单号

    userId: varchar("user_id", { length: 21 })
        .notNull()
        .references(() => users.sid, { onDelete: "cascade" }),

    // 订单基本信息
    orderType: orderTypeEnum("order_type").notNull(), // 订单类型
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 订单金额
    currency: varchar("currency", { length: 3 }).default("USD").notNull(), // 货币类型
    status: orderStatusEnum("status").default("pending").notNull(), // 订单状态

    // 支付信息
    paymentProvider: varchar("payment_provider", { length: 50 }).default("creeem").notNull(), // 支付方式，固定为creeem
    paymentIntentId: varchar("payment_intent_id", { length: 255 }), // 支付平台的支付ID
    transactionId: varchar("transaction_id", { length: 255 }), // 交易ID

    // 客户信息（快照，保存支付时的客户信息）
    customerId: varchar("customer_id", { length: 255 }), // Creeem平台的客户ID
    customerEmail: varchar("customer_email", { length: 255 }), // 客户邮箱
    customerName: varchar("customer_name", { length: 100 }), // 客户姓名
    customerCountry: varchar("customer_country", { length: 2 }), // 国家代码（ISO 3166-1 alpha-2）

    // 订阅相关（仅订阅类型订单使用）
    subscriptionType: varchar("subscription_type", { length: 20 }), // basic/ultimate
    subscriptionInterval: subscriptionIntervalEnum("subscription_interval"), // 订阅周期
    subscriptionStartDate: timestamp("subscription_start_date"), // 订阅开始日期
    subscriptionEndDate: timestamp("subscription_end_date"), // 订阅结束日期

    // 积分购买相关（仅积分类型订单使用）
    creditsAmount: integer("credits_amount"), // 购买的积分数量

    // 其他信息
    metadata: text("metadata"), // JSON格式的额外数据
    description: text("description"), // 订单描述

    // 时间戳
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    paidAt: timestamp("paid_at"), // 支付完成时间
    cancelledAt: timestamp("cancelled_at"), // 取消时间
    refundedAt: timestamp("refunded_at"), // 退款时间
}, (table) => ({
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    statusIdx: index("orders_status_idx").on(table.status),
    orderTypeIdx: index("orders_type_idx").on(table.orderType),
    createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
    orderNoIdx: index("orders_order_no_idx").on(table.orderNo),
    customerEmailIdx: index("orders_customer_email_idx").on(table.customerEmail),
    customerIdIdx: index("orders_customer_id_idx").on(table.customerId),
}));

// 订阅历史表（用于追踪订阅变更）
export const subscriptionHistory = pgTable("subscription_history", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 21 })
        .notNull()
        .references(() => users.sid, { onDelete: "cascade" }),

    orderId: integer("order_id").references(() => orders.id), // 关联订单

    subscriptionType: varchar("subscription_type", { length: 20 }).notNull(), // basic/ultimate/free
    subscriptionInterval: subscriptionIntervalEnum("subscription_interval"), // 订阅周期

    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    // new 新订阅 renew 续订 upgrade 升级 downgrade 降级 cancel 取消
    action: varchar("action", { length: 20 }).notNull(), // new/renew/upgrade/downgrade/cancel

    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("subscription_history_user_id_idx").on(table.userId),
    orderIdIdx: index("subscription_history_order_id_idx").on(table.orderId),
}));

// 导出类型
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type NewSubscriptionHistory = typeof subscriptionHistory.$inferInsert;

