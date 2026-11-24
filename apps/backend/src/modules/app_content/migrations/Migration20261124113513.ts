import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261124113513 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "app_layout_version" drop constraint if exists "app_layout_version_tenant_id_page_version_unique";`);
    this.addSql(`alter table if exists "app_layout" drop constraint if exists "app_layout_tenant_id_page_unique";`);
    this.addSql(`alter table if exists "app_tenant" drop constraint if exists "app_tenant_slug_unique";`);
    this.addSql(`create table if not exists "app_tenant" ("id" text not null, "slug" text not null, "name" text not null, "status" text check ("status" in ('active', 'suspended')) not null default 'active', "is_default" boolean not null default false, "sales_channel_id" text not null, "api_key_id" text not null, "api_key_token" text not null, "branding" jsonb null, "features" jsonb null, "settings" jsonb null, "owner_email" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "app_tenant_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_tenant_slug_unique" ON "app_tenant" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_tenant_api_key_token" ON "app_tenant" ("api_key_token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_tenant_deleted_at" ON "app_tenant" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_app_layout_page_unique";`);

    this.addSql(`alter table if exists "app_layout" add column if not exists "tenant_id" text null;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_layout_tenant_id_page_unique" ON "app_layout" ("tenant_id", "page") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_app_layout_version_page_version_unique";`);

    this.addSql(`alter table if exists "app_layout_version" add column if not exists "tenant_id" text null;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_layout_version_tenant_id_page_version_unique" ON "app_layout_version" ("tenant_id", "page", "version") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "app_product_review" add column if not exists "tenant_id" text null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_product_review_tenant_id" ON "app_product_review" ("tenant_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "app_push_campaign" add column if not exists "tenant_id" text null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_push_campaign_tenant_id" ON "app_push_campaign" ("tenant_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "app_push_token" add column if not exists "tenant_id" text null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_push_token_tenant_id" ON "app_push_token" ("tenant_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "app_story" add column if not exists "tenant_id" text null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_story_tenant_id" ON "app_story" ("tenant_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "app_tenant" cascade;`);

    this.addSql(`drop index if exists "IDX_app_layout_tenant_id_page_unique";`);
    this.addSql(`alter table if exists "app_layout" drop column if exists "tenant_id";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_layout_page_unique" ON "app_layout" ("page") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_app_layout_version_tenant_id_page_version_unique";`);
    this.addSql(`alter table if exists "app_layout_version" drop column if exists "tenant_id";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_layout_version_page_version_unique" ON "app_layout_version" ("page", "version") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_app_product_review_tenant_id";`);
    this.addSql(`alter table if exists "app_product_review" drop column if exists "tenant_id";`);

    this.addSql(`drop index if exists "IDX_app_push_campaign_tenant_id";`);
    this.addSql(`alter table if exists "app_push_campaign" drop column if exists "tenant_id";`);

    this.addSql(`drop index if exists "IDX_app_push_token_tenant_id";`);
    this.addSql(`alter table if exists "app_push_token" drop column if exists "tenant_id";`);

    this.addSql(`drop index if exists "IDX_app_story_tenant_id";`);
    this.addSql(`alter table if exists "app_story" drop column if exists "tenant_id";`);
  }

}
