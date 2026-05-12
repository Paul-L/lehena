import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260512240000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "subscription_plan" (
        "id" text not null,
        "slug" text not null,
        "name" text not null,
        "description" text null,
        "price_cents" integer not null,
        "frequency_days" integer not null default 30,
        "box_size" integer not null,
        "hero_image_url" text null,
        "stripe_price_env_key" text not null,
        "active" boolean not null default true,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "subscription_plan_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_plan_slug_unique" ON "subscription_plan" ("slug") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "subscription" (
        "id" text not null,
        "customer_id" text not null,
        "plan_id" text not null,
        "status" text check ("status" in ('incomplete', 'active', 'paused', 'cancelled', 'past_due')) not null default 'incomplete',
        "stripe_subscription_id" text not null,
        "stripe_customer_id" text not null,
        "current_period_start" timestamptz null,
        "current_period_end" timestamptz null,
        "next_charge_at" timestamptz null,
        "shipping_address" jsonb null,
        "gift_message" text null,
        "notes" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "subscription_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_stripe_unique" ON "subscription" ("stripe_subscription_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_customer" ON "subscription" ("customer_id", "status") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_next_charge" ON "subscription" ("next_charge_at") WHERE deleted_at IS NULL AND status = 'active';`
    )

    this.addSql(
      `create table if not exists "subscription_event_log" (
        "id" text not null,
        "stripe_event_id" text not null,
        "event_type" text not null,
        "subscription_id" text null,
        "outcome" text check ("outcome" in ('processed', 'skipped', 'failed')) not null default 'processed',
        "notes" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "subscription_event_log_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_event_unique" ON "subscription_event_log" ("stripe_event_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "subscription_event_log" cascade;`)
    this.addSql(`drop table if exists "subscription" cascade;`)
    this.addSql(`drop table if exists "subscription_plan" cascade;`)
  }
}
