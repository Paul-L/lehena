import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260512120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "gdpr_log" (
        "id" text not null,
        "customer_id" text not null,
        "action" text check ("action" in ('export_requested', 'export_completed', 'delete_requested', 'delete_completed')) not null,
        "ip" text null,
        "notes" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "gdpr_log_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_gdpr_log_customer_created" ON "gdpr_log" ("customer_id", "created_at" DESC);`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gdpr_log" cascade;`)
  }
}
