import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260512110000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "invoice" (
        "id" text not null,
        "order_id" text not null,
        "number" text not null,
        "year" integer not null,
        "amount" integer not null,
        "currency_code" text not null default 'eur',
        "storage_url" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "invoice_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_number_unique" ON "invoice" ("number") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_order_unique" ON "invoice" ("order_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_invoice_year" ON "invoice" ("year") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "invoice" cascade;`)
  }
}
