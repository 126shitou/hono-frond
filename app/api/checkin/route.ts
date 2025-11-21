import { NextResponse } from "next/server";
import { Result } from "@/lib/utils/result";
import { checkinRecords, users } from "@/lib/db/schema/user";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, sql } from "@/lib/db";
import { customError } from "@/lib/utils/log";
import { auth } from "@/auth";

export async function POST() {
    try {
        const session = await auth();
        const uid = session?.user?.id || null;
        if (!uid) {
            return NextResponse.json(Result.fail("Please login first ！"), { status: 401 });
        }

        // 获取当前UTC时间
        const nowUTC = new Date();

        // 计算今天UTC时间的开始和结束
        const todayStartUTC = new Date(
            Date.UTC(
                nowUTC.getUTCFullYear(),
                nowUTC.getUTCMonth(),
                nowUTC.getUTCDate(),
                0,
                0,
                0,
                0
            )
        );

        const todayEndUTC = new Date(
            Date.UTC(
                nowUTC.getUTCFullYear(),
                nowUTC.getUTCMonth(),
                nowUTC.getUTCDate(),
                23,
                59,
                59,
                999
            )
        );


        // 检查今天是否已经签到
        const existingCheckin = await db
            .select()
            .from(checkinRecords)
            .where(
                and(
                    eq(checkinRecords.sid, uid),
                    gte(checkinRecords.checkinDate, todayStartUTC),
                    lte(checkinRecords.checkinDate, todayEndUTC)
                )
            )
            .limit(1);

        if (existingCheckin.length > 0) {
            return NextResponse.json(Result.fail("You have already checked in today."), { status: 400 });
        }

        // 计算奖励积分（固定2分）
        const rewardPoints = 2;

        // 1. 获取当前用户积分
        const currentUser = await db
            .select({
                boundsPoints: users.boundsPoints,
                totalPoints: users.totalPoints,
            })
            .from(users)
            .where(eq(users.sid, uid))
            .limit(1);

        if (currentUser.length === 0) {
            return NextResponse.json(Result.fail("User does not exist."), { status: 404 });
        }

        const newBoundsPoints = (currentUser[0].boundsPoints || 0) + rewardPoints;
        const newTotalPoints = (currentUser[0].totalPoints || 0) + rewardPoints;
        const checkinRecordId = `checkin_${Date.now()}`;

        // 2. 使用事务确保签到记录、积分增加和历史记录的原子性
        await sql.transaction([
            // 创建签到记录
            sql`
                INSERT INTO checkin_records (sid, checkin_date, reward_points, created_at)
                VALUES (${uid}, ${nowUTC}, ${rewardPoints}, NOW())
            `,
            // 更新用户积分
            sql`
                UPDATE users 
                SET 
                    bounds_points = ${newBoundsPoints},
                    total_points = ${newTotalPoints},
                    updated_at = ${nowUTC}
                WHERE sid = ${uid}
            `,
            // 创建积分历史记录
            sql`
                INSERT INTO points_history (sid, action, points, record_id, points_detail, created_at, updated_at)
                VALUES (${uid}, 'reward', ${rewardPoints}, ${checkinRecordId}, ${{ bounds: rewardPoints }}, NOW(), NOW())
            `,
        ]);

        const result = {
            rewardPoints,
        };

        return NextResponse.json(Result.success(result));
    } catch (error) {
        customError(
            `api > checkin POST 签到失败, Error: ${JSON.stringify(error)}`
        );
        return NextResponse.json(Result.fail("Check-in failed, please try again later."), { status: 500 });
    }
}