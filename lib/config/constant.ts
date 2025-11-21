import { feedBackTypeValues } from "@/lib/db/schema/user";

// ==================== 积分相关（应用层特有） ====================

/**
 * 积分历史查询类型（用于 API 查询参数）
 * 
 * ⚠️ 注意：这是前端友好的查询分类，与数据库的 points_action 枚举不同
 * 一个查询类型可能对应多个数据库 action
 * 
 * - consumed: 消耗记录（生成图片/视频等）→ 对应 action: 'deduct'
 * - refunded: 退款记录（任务失败退还）→ 对应 action: 'refund'
 * - purchased: 购买记录（充值、订阅）→ 对应 action: 'purchase'
 * - rewarded: 奖励记录（签到、活动）→ 对应 action: 'reward'
 * - obtained: 获得记录（购买+奖励）→ 对应 action: 'purchase' OR 'reward'
 * 
 * 使用场景：GET /api/point?action=consumed
 */
export const POINTS_HISTORY_QUERY_TYPE = ["consumed", "refunded", "purchased", "rewarded", "obtained"] as const;

/**
 * 积分池类型（用户拥有三种不同来源的积分）
 * 
 * 用户的积分分为三个独立的积分池，消耗时按优先级顺序扣除
 * - bounds: 奖励积分（签到、活动获得，优先消耗，有效期限制）
 * - membership: 会员积分（订阅会员获得，次优先消耗）
 * - topup: 充值积分（用户付费购买，最后消耗，永久有效）
 * 
 * 消耗优先级：bounds → membership → topup
 * 
 * 使用场景：
 * - users 表字段：bounds_points, membership_points, topup_points
 * - points_detail 字段：记录每次操作涉及的具体积分池变化
 * 示例：{ bounds: -5, membership: -3, topup: -4 } 表示从三个池各扣除相应积分
 */
export const POINTS_POOL_TYPE = ["membership", "topup", "bounds"] as const;



export const FEED_BACK_TYPE = feedBackTypeValues;
