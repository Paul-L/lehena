import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260511120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "page" add column if not exists "noindex" boolean not null default false;`
    )
    this.addSql(
      `alter table if exists "page" add column if not exists "canonical_override" text null;`
    )
    this.addSql(
      `alter table if exists "page" add column if not exists "translation_group_id" text null;`
    )

    // Slug uniqueness moves from global to (slug, locale) so that a French
    // page and a Spanish page can share a slug like "contact" without
    // colliding. Drop the old unique index first.
    this.addSql(`drop index if exists "IDX_page_slug_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_locale_unique" ON "page" ("slug", "locale") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_page_translation_group" ON "page" ("translation_group_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_page_translation_group";`)
    this.addSql(`drop index if exists "IDX_page_slug_locale_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_page_slug_unique" ON "page" ("slug") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `alter table if exists "page" drop column if exists "translation_group_id";`
    )
    this.addSql(
      `alter table if exists "page" drop column if exists "canonical_override";`
    )
    this.addSql(`alter table if exists "page" drop column if exists "noindex";`)
  }
}
