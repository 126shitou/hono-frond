CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('subscription', 'credits');--> statement-breakpoint
CREATE TYPE "public"."subscription_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_no" varchar(50) NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"order_type" "order_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_provider" varchar(50) DEFAULT 'creeem' NOT NULL,
	"payment_intent_id" varchar(255),
	"transaction_id" varchar(255),
	"customer_id" varchar(255),
	"customer_email" varchar(255),
	"customer_name" varchar(100),
	"customer_country" varchar(2),
	"subscription_type" varchar(20),
	"subscription_interval" "subscription_interval",
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"credits_amount" integer,
	"metadata" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"cancelled_at" timestamp,
	"refunded_at" timestamp,
	CONSTRAINT "orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "subscription_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"order_id" integer,
	"subscription_type" varchar(20) NOT NULL,
	"subscription_interval" "subscription_interval",
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"action" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "points_history" ADD COLUMN "order_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_sid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("sid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_users_sid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("sid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_type_idx" ON "orders" USING btree ("order_type");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_order_no_idx" ON "orders" USING btree ("order_no");--> statement-breakpoint
CREATE INDEX "orders_customer_email_idx" ON "orders" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscription_history_user_id_idx" ON "subscription_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_history_order_id_idx" ON "subscription_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "points_history_order_id_idx" ON "points_history" USING btree ("order_id");