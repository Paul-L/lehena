import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260511130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "contact_submission" (
        "id" text not null,
        "name" text not null,
        "email" text not null,
        "subject" text not null,
        "message" text not null,
        "locale" text not null default 'fr',
        "metadata" jsonb null,
        "status" text check ("status" in ('new', 'read', 'replied', 'spam')) not null default 'new',
        "read_at" timestamptz null,
        "replied_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "contact_submission_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_contact_submission_status_created" ON "contact_submission" ("status", "created_at" DESC) WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_contact_submission_deleted_at" ON "contact_submission" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "contact_submission" cascade;`)
  }
}
