import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Additive-only: adds the nullable `faq` json column to `page`
 * (array of `{ question, answer }` for the FAQPage schema, cf. SEO 06).
 *
 * Hand-written rather than kept verbatim from `medusa db:generate`: on this
 * project the generator emits a full cross-schema diff that DROPS constraints
 * on core tables — the known-destructive pattern (incident 2026-05-13). Only
 * the single ADD COLUMN below is the real intent; nothing is dropped on `up`.
 */
export class Migration20260721131505 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "page" add column if not exists "faq" jsonb null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "page" drop column if exists "faq";`)
  }
}
