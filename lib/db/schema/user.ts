import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  serial,
  varchar,
  index,
  uniqueIndex,
  json,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// 定义订阅类型枚举值（导出供应用层使用）
export const subscriptionTypeValues = ["free", "basic", "ultimate"] as const;

export const subscriptionTypeEnum = pgEnum(
  "subscription_type",
  subscriptionTypeValues as unknown as [string, ...string[]]
);


// 定义user表
export const users = pgTable("users", {
  sid: varchar("sid", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()), // 使用nanoid作为默认ID
  name: varchar("name", { length: 100 }).notNull(), // 用户名，限制100字符
  avatar: varchar("avatar", { length: 500 }), // 头像URL，限制500字符
  email: varchar("email", { length: 255 }).notNull().unique(), // 邮箱，限制255字符
  // 三种不同类型的积分
  membershipPoints: integer("membership_points").default(0).notNull(), // 会员积分
  topupPoints: integer("topup_points").default(0).notNull(), // 充值积分
  boundsPoints: integer("bounds_points").default(0).notNull(), // 奖励积分
  // 保留总积分字段用于快速查询
  totalPoints: integer("total_points").default(0).notNull(), // 总积分

  subscriptionType: subscriptionTypeEnum("subscription_type")
    .default("free")
    .notNull(), // 订阅类型，默认Free
  createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // 更新时间
  subscriptionsStartDate: timestamp("subscriptions_start_date"), // 订阅开始日期，可选
  subscriptionsEndDate: timestamp("subscriptions_end_date"), // 订阅结束日期，可选
  lastLogin: timestamp("last_login"), // 最后登录时间，可选
}, (table) => ({
  // 添加索引以提高查询性能
  totalPointsIdx: index("users_total_points_idx").on(table.totalPoints),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
}));


// 账户表 - 存储第三方认证信息
export const accounts = pgTable(
  "accounts",
  {
    userId: varchar("userId", { length: 21 })
      .notNull()
      .references(() => users.sid, { onDelete: "cascade" }), // 引用 users.sid
    provider: varchar("provider", { length: 50 }).notNull(), // OAuth提供商名称
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(), // 提供商账户ID
    refresh_token: text("refresh_token"), // 刷新令牌，可能很长，保持text
    access_token: text("access_token"), // 访问令牌，可能很长，保持text
    expires_at: integer("expires_at"), // 过期时间戳
    token_type: varchar("token_type", { length: 50 }), // 令牌类型
    scope: varchar("scope", { length: 500 }), // 权限范围
    id_token: text("id_token"), // ID令牌，可能很长，保持text
    session_state: varchar("session_state", { length: 255 }), // 会话状态
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    // 添加索引以提高查询性能
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  })
);

// 定义积分变化类型枚举值（导出供应用层使用）
export const pointsActionValues = [
  "deduct",      // 扣除（生成消耗）
  "refund",      // 退款（生成失败退还）
  "purchase",    // 购买（充值、订阅）
  "reward",      // 奖励（签到、活动）
  "admin",       // 管理员操作
] as const;

// 定义积分变化类型枚举（数据库层）
export const pointsActionEnum = pgEnum("points_action", pointsActionValues as unknown as [string, ...string[]]);

// 定义积分变化表
export const pointsHistory = pgTable("points_history", {
  id: serial("id").primaryKey(), // 自增主键
  sid: varchar("sid", { length: 21 })
    .notNull()
    .references(() => users.sid), // 关联用户表的sid
  action: pointsActionEnum("action").default("deduct").notNull(), // 操作类型：扣除、退款、购买、奖励等
  // 积分变化详情：记录各类型积分的具体变化量
  pointsDetail: json("points_detail").$type<{
    bounds?: number;      // 奖励积分变化（正数增加，负数减少）
    membership?: number;  // 会员积分变化
    topup?: number;       // 充值积分变化
  }>().default({}).notNull(), // JSON 格式记录各积分池的变化
  points: integer("points").notNull(), // 总积分变化数量（正数为增加，负数为消耗）
  recordId: varchar("record_id", { length: 21 }), // 相关记录ID，可选（如生成记录ID、订单ID等）
  orderId: integer("order_id"), // 关联订单表的ID，用于支付相关的积分变化
  createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // 更新时间
}, (table) => ({
  // 添加索引以提高查询性能
  sidIdx: index("points_history_sid_idx").on(table.sid),
  actionIdx: index("points_history_action_idx").on(table.action), // 新增：action 索引
  createdAtIdx: index("points_history_created_at_idx").on(table.createdAt),
  recordIdIdx: index("points_history_record_id_idx").on(table.recordId),
  pointsIdx: index("points_history_points_idx").on(table.points),
  orderIdIdx: index("points_history_order_id_idx").on(table.orderId),
}));

export const checkinRecords = pgTable("checkin_records", {
  id: serial("id").primaryKey(),
  sid: varchar("sid", { length: 21 })
    .notNull()
    .references(() => users.sid),
  checkinDate: timestamp("checkin_date").notNull(), // 签到日期（只到天）
  rewardPoints: integer("reward_points").notNull(), // 本次签到获得的积分
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sidCheckinDateIdx: uniqueIndex("checkin_records_sid_checkin_date_idx")
    .on(table.sid, table.checkinDate),
}));

// 定义反馈类型枚举值（导出供应用层使用）
export const feedBackTypeValues = ["issue", "feature", "bug", "model", "other"] as const;

export const feedBackTypeEnum = pgEnum(
  "feedBack_type",
  feedBackTypeValues as unknown as [string, ...string[]]
)

export const feedBack = pgTable("feedback", {
  id: serial("id").primaryKey(),
  sid: varchar("sid", { length: 21 }).references(() => users.sid),
  type: feedBackTypeEnum("type").notNull(),
  details: text("details").notNull(),
  urls: text("urls").array(),
}, t => [])

// 导出类型
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PointsHistory = typeof pointsHistory.$inferSelect;
export type NewPointsHistory = typeof pointsHistory.$inferInsert;
export type CheckinRecord = typeof checkinRecords.$inferSelect;
export type NewCheckinRecord = typeof checkinRecords.$inferInsert;
