import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260511124900 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_details" ("id" text not null, "aging_months" integer null, "origin" text not null, "breed" text null, "allergens" text[] null, "nitrite_free" boolean not null default false, "conservation_temp" text check ("conservation_temp" in ('ambient', 'fresh', 'frozen')) not null default 'ambient', "conservation_days_after_opening" integer null, "ddm_days" integer not null, "cure_method" text null, "nutritional" jsonb null, "ingredients" text null, "terroir_story" text null, "pairings_tags" text[] null, "seo_title" text null, "seo_description" text null, "og_image_url" text null, "noindex" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_details_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_details_deleted_at" ON "product_details" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "variant_details" ("id" text not null, "weight_grams" integer not null, "format" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "variant_details_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_variant_details_deleted_at" ON "variant_details" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_details" cascade;`)

    this.addSql(`drop table if exists "variant_details" cascade;`)
  }
}
