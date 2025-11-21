import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Result } from "@/lib/utils/result";
import { pointsHistory } from "@/lib/db/schema/user";
import { eq, desc, and, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customError } from "@/lib/utils/log";

// 查询积分变化列表的返回结果接口
export type PointsHistoryItem = {
  id: number;
  action: string;
  points: number;
  pointsDetail: {
    bounds?: number;
    membership?: number;
    topup?: number;
  };
  recordId: string | null;
  orderId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录状态
    const session = await auth();
    const uid = session?.user?.id;

    if (!session || !uid) {
      return NextResponse.json(Result.fail("Please login first ！"), { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // 可选：deduct, refund, purchase, reward

    // 构建查询条件
    const conditions = [eq(pointsHistory.sid, uid)];

    // 添加 action 类型过滤
    if (action) {
      switch (action) {
        case "consumed":
          // 消耗类型：deduct 操作（积分为负数）
          conditions.push(eq(pointsHistory.action, "deduct"));
          break;
        case "refunded":
          // 退款类型：refund 操作
          conditions.push(eq(pointsHistory.action, "refund"));
          break;
        case "purchased":
          // 购买类型：purchase 操作
          conditions.push(eq(pointsHistory.action, "purchase"));
          break;
        case "rewarded":
          // 奖励类型：reward 操作
          conditions.push(eq(pointsHistory.action, "reward"));
          break;
        case "obtained":
          // 获得类型：包括 purchase 和 reward
          const obtainedCondition = or(
            eq(pointsHistory.action, "purchase"),
            eq(pointsHistory.action, "reward")
          );
          if (obtainedCondition) {
            conditions.push(obtainedCondition);
          }
          break;
      }
    }

    const whereCondition = and(...conditions);

    // 查询列表数据
    const historyList = await db
      .select({
        id: pointsHistory.id,
        action: pointsHistory.action,
        points: pointsHistory.points,
        pointsDetail: pointsHistory.pointsDetail,
        recordId: pointsHistory.recordId,
        createdAt: pointsHistory.createdAt,
        updatedAt: pointsHistory.updatedAt,
      })
      .from(pointsHistory)
      .where(whereCondition)
      .orderBy(desc(pointsHistory.createdAt)); // 按创建时间倒序排列

    return NextResponse.json(Result.success(historyList));
  } catch (error) {
    customError(
      `api > point > GET: 查询积分变化列表失败, Error: ${JSON.stringify(error)}`
    );

    const errorMsg = error instanceof Error ? error.message : "Failed to query the list of points changes";
    return NextResponse.json(Result.fail(errorMsg), { status: 500 });
  }
}