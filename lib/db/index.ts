import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon HTTP 连接（适合 Cloudflare Workers）
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
export { sql }; // 导出 sql 用于事务操作