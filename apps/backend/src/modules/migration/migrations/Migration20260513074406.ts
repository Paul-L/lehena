import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260513074406 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "migration_run" ("id" text not null, "script" text check ("script" in ('products', 'customers', 'media')) not null, "source" text check ("source" in ('api', 'fixtures')) not null, "dry_run" boolean not null default true, "limit" integer null, "status" text check ("status" in ('pending', 'running', 'completed', 'failed')) not null default 'pending', "totals" jsonb null, "entries" jsonb null, "error_message" text null, "workflow_execution_id" text null, "triggered_by" text null, "started_at" timestamptz null, "finished_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "migration_run_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_migration_run_deleted_at" ON "migration_run" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "migration_run" cascade;`);
  }

}
