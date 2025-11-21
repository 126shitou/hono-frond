CREATE TYPE "public"."points_action" AS ENUM('deduct', 'refund', 'purchase', 'reward', 'admin');--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "points_refunded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "points_history" ADD COLUMN "action" "points_action" DEFAULT 'deduct' NOT NULL;--> statement-breakpoint
ALTER TABLE "points_history" ADD COLUMN "points_detail" json DEFAULT '{}'::json NOT NULL;--> statement-breakpoint
CREATE INDEX "points_history_action_idx" ON "points_history" USING btree ("action");--> statement-breakpoint
ALTER TABLE "points_history" DROP COLUMN "type";