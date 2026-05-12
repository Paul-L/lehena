import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260512210000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "author" (
        "id" text not null,
        "slug" text not null,
        "name" text not null,
        "bio" text null,
        "photo_url" text null,
        "social_links" jsonb null,
        "locale" text not null default 'fr',
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "author_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_author_slug_unique" ON "author" ("slug") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "author" cascade;`)
  }
}
