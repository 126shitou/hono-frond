import { NextResponse } from "next/server";
import { Result } from "@/lib/utils/result";
import { checkinRecords, CheckinRecord } from "@/lib/db/schema/user";
import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { customError } from "@/lib/utils/log";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        const uid = session?.user?.id || null;

        if (!uid) {
            return NextResponse.json(Result.fail("Please login first ！"), { status: 401 });
        }

        // 获取当前UTC时间
        const now = new Date();

        // 计算当前周的开始时间（周日 00:00:00 UTC）
        const currentDay = now.getUTCDay(); // 0=周日, 1=周一, ..., 6=周六
        const weekStart = new Date(now);
        weekStart.setUTCDate(now.getUTCDate() - currentDay);
        weekStart.setUTCHours(0, 0, 0, 0);

        // 计算当前周的结束时间（周六 23:59:59 UTC）
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        weekEnd.setUTCHours(23, 59, 59, 999);
 
        console.time("query Db");

        // 优化查询：利用复合索引 (sid, checkin_date)，减少查询条件
        // 只查询必要字段，减少数据传输量
        const weeklyCheckins = await db
            .select({
                id: checkinRecords.id,
                checkinDate: checkinRecords.checkinDate,
                rewardPoints: checkinRecords.rewardPoints,
            })
            .from(checkinRecords)
            .where(
                and(
                    eq(checkinRecords.sid, uid),
                    gte(checkinRecords.checkinDate, weekStart),
                    lte(checkinRecords.checkinDate, weekEnd)
                )
            )
            .orderBy(checkinRecords.checkinDate)
            .limit(7); // 明确限制结果集大小

        console.timeEnd("query Db");
        // 创建一个长度为7的数组，初始化为null
        const weeklyData: (Pick<CheckinRecord, "id" | "checkinDate" | "rewardPoints"> | null)[] = [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        ];

        // 获取今天是周几（0=周日, 1=周一, ..., 6=周六）
        const todayDayOfWeek = now.getUTCDay();

        // 将查询到的签到记录填入对应的位置
        weeklyCheckins.forEach((record) => {
            const checkinDate = new Date(record.checkinDate);
            const dayOfWeek = checkinDate.getUTCDay(); // 0=周日, 1=周一, ..., 6=周六

            weeklyData[dayOfWeek] = record;
        });

        // 判断今天是否可以签到（检查今天对应位置是否为null）
        const canCheckinToday = weeklyData[todayDayOfWeek] === null;

        return NextResponse.json(Result.success({
            weeklyData,
            canCheckinToday,
        }));
    } catch (error) {
        customError(
            `api > checkin > history GET 查询签到记录失败, Error: ${JSON.stringify(error)}`
        );
        return NextResponse.json(Result.fail("Server:Failed to retrieve check-in history"), { status: 500 });
    }
}