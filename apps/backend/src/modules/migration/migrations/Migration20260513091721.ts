import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds the `wc_credentials` singleton table for the migration module.
 *
 * NOTE — 2026-05-24 rewrite. The previous version of this file was
 * auto-generated via `medusa db:generate migration` against a database
 * that already held every other module's tables. MikroORM diffed the
 * schema against this module's only entity at the time (`wc_credentials`)
 * and emitted `drop table if exists ... cascade` for ~100 unrelated
 * tables (product, cart, order, region, tax_provider, payment_provider,
 * etc.). Running it wiped the schema and broke server boot with
 * `relation "tax_provider" does not exist` and friends.
 *
 * Lesson: never run `medusa db:generate <module>` against a shared
 * `public` schema that contains tables the module does not own — the
 * auto-diff is destructive. For modules sharing DATABASE_URL with the
 * rest of the stack, hand-write the migration like this one.
 */
export class Migration20260513091721 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "wc_credentials" (` +
        `"id" text not null, ` +
        `"url" text not null, ` +
        `"consumer_key" text not null, ` +
        `"encrypted_consumer_secret" text not null, ` +
        `"secret_hint" text null, ` +
        `"validated_at" timestamptz null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `"deleted_at" timestamptz null, ` +
        `constraint "wc_credentials_pkey" primary key ("id")` +
        `);`
    )
    this.addSql(
      `create index if not exists "IDX_wc_credentials_deleted_at" ` +
        `on "wc_credentials" ("deleted_at") where "deleted_at" is null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wc_credentials" cascade;`)
  }
}
