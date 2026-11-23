import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261123201525 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "app_product_review" drop constraint if exists "app_product_review_order_id_product_id_unique";`);
    this.addSql(`create table if not exists "app_product_review" ("id" text not null, "product_id" text not null, "order_id" text not null, "rating" integer not null, "name" text not null, "comment" text null, "status" text check ("status" in ('approved', 'hidden')) not null default 'approved', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "app_product_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_product_review_product_id" ON "app_product_review" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_product_review_deleted_at" ON "app_product_review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_product_review_order_id_product_id_unique" ON "app_product_review" ("order_id", "product_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "app_push_token" add column if not exists "order_ids" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "app_product_review" cascade;`);

    this.addSql(`alter table if exists "app_push_token" drop column if exists "order_ids";`);
  }

}
