CREATE TYPE "public"."generation_status" AS ENUM('waiting', 'processing', 'succeed', 'failed', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('waiting', 'fail', 'success');--> statement-breakpoint
CREATE TYPE "public"."upload_source" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."feedBack_type" AS ENUM('issue', 'feature', 'bug', 'model', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_type" AS ENUM('free', 'basic', 'ultimate');--> statement-breakpoint
CREATE TABLE "medias" (
	"id" text PRIMARY KEY NOT NULL,
	"sid" text,
	"record_id" text,
	"task_id" text,
	"url" text NOT NULL,
	"type" text,
	"media_type" "media_type" NOT NULL,
	"aspect_ratio" text,
	"upload_source" "upload_source" DEFAULT 'user',
	"category" text[] DEFAULT '{}',
	"meta" json,
	"is_delete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" text PRIMARY KEY NOT NULL,
	"sid" text NOT NULL,
	"type" text NOT NULL,
	"tool" text NOT NULL,
	"parameters" json NOT NULL,
	"status" "record_status" DEFAULT 'waiting' NOT NULL,
	"fail_desc" text DEFAULT '',
	"expected_count" integer NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_delete" boolean DEFAULT false NOT NULL,
	"points_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"task_id" text NOT NULL,
	"status" "generation_status" NOT NULL,
	"result" json,
	"submit_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" varchar(21) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(50),
	"scope" varchar(500),
	"id_token" text,
	"session_state" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkin_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"sid" varchar(21) NOT NULL,
	"checkin_date" timestamp NOT NULL,
	"reward_points" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"sid" varchar(21),
	"type" "feedBack_type" NOT NULL,
	"details" text NOT NULL,
	"urls" text[]
);
--> statement-breakpoint
CREATE TABLE "points_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"sid" varchar(21) NOT NULL,
	"type" text[] DEFAULT '{}' NOT NULL,
	"points" integer NOT NULL,
	"record_id" varchar(21),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"sid" varchar(21) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"avatar" varchar(500),
	"email" varchar(255) NOT NULL,
	"membership_points" integer DEFAULT 0 NOT NULL,
	"topup_points" integer DEFAULT 0 NOT NULL,
	"bounds_points" integer DEFAULT 0 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"subscription_type" "subscription_type" DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"subscriptions_start_date" timestamp,
	"subscriptions_end_date" timestamp,
	"last_login" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "medias" ADD CONSTRAINT "medias_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medias" ADD CONSTRAINT "medias_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_sid_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("sid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_records" ADD CONSTRAINT "checkin_records_sid_users_sid_fk" FOREIGN KEY ("sid") REFERENCES "public"."users"("sid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_sid_users_sid_fk" FOREIGN KEY ("sid") REFERENCES "public"."users"("sid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_sid_users_sid_fk" FOREIGN KEY ("sid") REFERENCES "public"."users"("sid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "checkin_records_sid_checkin_date_idx" ON "checkin_records" USING btree ("sid","checkin_date");--> statement-breakpoint
CREATE INDEX "points_history_sid_idx" ON "points_history" USING btree ("sid");--> statement-breakpoint
CREATE INDEX "points_history_created_at_idx" ON "points_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "points_history_record_id_idx" ON "points_history" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "points_history_points_idx" ON "points_history" USING btree ("points");--> statement-breakpoint
CREATE INDEX "users_total_points_idx" ON "users" USING btree ("total_points");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");