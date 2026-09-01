import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Additive-only: adds the EEAT byline fields to `author`
 * (role_title, credentials, email). All columns are nullable.
 *
 * Hand-written rather than kept verbatim from `medusa db:generate`: on this
 * project the generator emits a full cross-schema diff that DROPS constraints
 * on core tables (cart, customer, order…) — the known-destructive pattern
 * (incident 2026-05-13). Only the ADD COLUMN statements below are the real
 * intent; nothing is dropped on `up`.
 */
export class Migration20260721131504 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "author" add column if not exists "role_title" text null, add column if not exists "credentials" jsonb null, add column if not exists "email" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "author" drop column if exists "role_title", drop column if exists "credentials", drop column if exists "email";`
    )
  }
}
