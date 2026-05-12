import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260512200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "page" add column if not exists "type" text check ("type" in ('page', 'article', 'recipe', 'news')) not null default 'page';`
    )
    this.addSql(
      `alter table if exists "page" add column if not exists "author_id" text null;`
    )
    this.addSql(
      `alter table if exists "page" add column if not exists "tags" jsonb null;`
    )
    this.addSql(
      `alter table if exists "page" add column if not exists "pillar_slug" text null;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_type_status" ON "page" ("type", "status") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_pillar" ON "page" ("pillar_slug") WHERE deleted_at IS NULL AND pillar_slug IS NOT NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_page_pillar";`)
    this.addSql(`drop index if exists "IDX_page_type_status";`)
    this.addSql(
      `alter table if exists "page" drop column if exists "pillar_slug";`
    )
    this.addSql(`alter table if exists "page" drop column if exists "tags";`)
    this.addSql(
      `alter table if exists "page" drop column if exists "author_id";`
    )
    this.addSql(`alter table if exists "page" drop column if exists "type";`)
  }
}
