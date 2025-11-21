ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."generation_status";--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('waiting', 'success', 'fail');--> statement-breakpoint
UPDATE "tasks" SET "status" = 'success' WHERE "status" = 'succeed';--> statement-breakpoint
UPDATE "tasks" SET "status" = 'fail' WHERE "status" = 'failed';--> statement-breakpoint
UPDATE "tasks" SET "status" = 'waiting' WHERE "status" = 'processing';--> statement-breakpoint
UPDATE "tasks" SET "status" = 'fail' WHERE "status" = 'unknown';--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DATA TYPE "public"."generation_status" USING "status"::"public"."generation_status";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "fail_desc";