import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Result } from "@/lib/utils/result";
import { medias, records } from "@/lib/db/schema/generation";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { customError } from "@/lib/utils/log";

export async function GET(_request: NextRequest) {
    try {
        // 验证用户登录状态
        const session = await auth();
        const sid = session?.user?.id;

        if (!session || !sid) {
            return NextResponse.json(Result.fail("Please login first ！"), { status: 401 });
        }


        // 联表查询 medias 和 records，以 media 为主
        // 查询字段：media 的 url、type，record 的 parameters、created_at
        const mediaHistory = await db
            .select({
                id: medias.id,
                url: medias.url,
                type: medias.type,
                mediaType: medias.mediaType,
                aspectRatio: medias.aspectRatio,
                parameters: records.parameters,
                createdAt: records.createdAt,
            })
            .from(medias)
            .leftJoin(records, eq(medias.recordId, records.id))
            .where(and(eq(medias.sid, sid), eq(medias.isDelete, false)))
            .orderBy(desc(records.createdAt));

        return NextResponse.json(Result.success(mediaHistory));
    } catch (error) {
        customError(
            `api > user > media > GET: 获取用户媒体历史失败，Error：${JSON.stringify(error)}`
        );

        const errorMsg = error instanceof Error ? error.message : "Failed to retrieve user media history";
        return NextResponse.json(Result.fail(errorMsg), { status: 500 });
    }
}