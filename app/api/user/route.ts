import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Result } from "@/lib/utils/result";
import { users } from "@/lib/db/schema/user";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customError } from "@/lib/utils/log";

export async function GET(_request: NextRequest) {
    try {
        // 验证用户登录状态
        const session = await auth();
        const uid = session?.user?.id;

        if (!session || !uid) {
            return NextResponse.json(Result.fail("User not logged in"), { status: 401 });
        }


        // 根据uid从数据库查询用户数据
        const userFromDb = await db
            .select()
            .from(users)
            .where(eq(users.sid, uid))
            .limit(1);

        if (userFromDb.length === 0) {
            return NextResponse.json(Result.fail("User does not exist."), { status: 404 });
        }

        const user = userFromDb[0];

        return NextResponse.json(Result.success(user));
    } catch (error) {
        customError(
            `api > point > user > GET: 获取用户信息失败, Error: ${JSON.stringify(error)}`
        );

        const errorMsg = error instanceof Error ? error.message : "Failed to retrieve user information";
        return NextResponse.json(Result.fail(errorMsg), { status: 500 });
    }
}