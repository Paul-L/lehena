import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260511135823 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "redirect" drop constraint if exists "redirect_from_path_unique";`
    )
    this.addSql(
      `create table if not exists "handle_snapshot" ("id" text not null, "resource_type" text check ("resource_type" in ('product', 'category', 'page')) not null, "resource_id" text not null, "handle" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "handle_snapshot_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_handle_snapshot_deleted_at" ON "handle_snapshot" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "redirect" ("id" text not null, "from_path" text not null, "to_path" text not null, "status" integer not null default 301, "source" text check ("source" in ('product', 'category', 'page', 'manual')) not null default 'manual', "source_id" text null, "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "redirect_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_redirect_from_path_unique" ON "redirect" ("from_path") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_redirect_deleted_at" ON "redirect" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "handle_snapshot" cascade;`)

    this.addSql(`drop table if exists "redirect" cascade;`)
  }
}
