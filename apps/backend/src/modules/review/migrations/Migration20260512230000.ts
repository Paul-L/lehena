import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260512230000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "review" (
        "id" text not null,
        "product_id" text not null,
        "customer_id" text null,
        "customer_name" text null,
        "rating" integer not null,
        "title" text null,
        "body" text not null,
        "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending',
        "approved_at" timestamptz null,
        "approved_by" text null,
        "order_id" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "review_pkey" primary key ("id"),
        constraint "review_rating_range" check ("rating" >= 1 and "rating" <= 5)
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_unique" ON "review" ("product_id", "customer_id") WHERE deleted_at IS NULL AND customer_id IS NOT NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_review_product_status" ON "review" ("product_id", "status", "approved_at" DESC) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_review_status" ON "review" ("status", "created_at" DESC) WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`)
  }
}
