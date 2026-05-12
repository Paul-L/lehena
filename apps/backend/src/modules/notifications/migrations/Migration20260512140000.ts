import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260512140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "email_sent_log" (
        "id" text not null,
        "template" text not null,
        "dedupe_key" text not null,
        "recipient" text not null,
        "resend_id" text null,
        "status" text check ("status" in ('sent', 'failed', 'skipped')) not null default 'sent',
        "notes" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "email_sent_log_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_email_sent_unique" ON "email_sent_log" ("template", "dedupe_key") WHERE deleted_at IS NULL AND status = 'sent';`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_email_sent_recipient" ON "email_sent_log" ("recipient", "created_at" DESC) WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "email_sent_log" cascade;`)
  }
}
