import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261122073925 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "app_push_token" drop constraint if exists "app_push_token_token_unique";`);
    this.addSql(`alter table if exists "app_layout_version" drop constraint if exists "app_layout_version_page_version_unique";`);
    this.addSql(`alter table if exists "app_layout" drop constraint if exists "app_layout_page_unique";`);
    this.addSql(`create table if not exists "app_layout" ("id" text not null, "page" text not null, "draft" jsonb not null, "published" jsonb null, "version" integer not null default 0, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "app_layout_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_layout_page_unique" ON "app_layout" ("page") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_layout_deleted_at" ON "app_layout" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "app_layout_version" ("id" text not null, "page" text not null, "version" integer not null, "blocks" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "app_layout_version_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_layout_version_deleted_at" ON "app_layout_version" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_layout_version_page_version_unique" ON "app_layout_version" ("page", "version") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "app_push_campaign" ("id" text not null, "kind" text check ("kind" in ('campaign', 'abandoned_cart')) not null default 'campaign', "title" text not null, "body" text not null, "link" text null, "audience" jsonb null, "status" text check ("status" in ('sending', 'sent', 'failed')) not null default 'sending', "sent_count" integer not null default 0, "failed_count" integer not null default 0, "sent_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "app_push_campaign_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_push_campaign_deleted_at" ON "app_push_campaign" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "app_push_token" ("id" text not null, "token" text not null, "platform" text not null, "cart_id" text null, "customer_id" text null, "province" text null, "enabled" boolean not null default true, "last_seen_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "app_push_token_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_app_push_token_token_unique" ON "app_push_token" ("token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_push_token_deleted_at" ON "app_push_token" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "app_story" ("id" text not null, "title" text not null, "media_url" text not null, "media_type" text check ("media_type" in ('image', 'video')) not null default 'image', "thumbnail_url" text null, "link" text null, "cta_label" text null, "rank" integer not null default 0, "is_active" boolean not null default true, "starts_at" timestamptz null, "expires_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "app_story_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_app_story_deleted_at" ON "app_story" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "app_layout" cascade;`);

    this.addSql(`drop table if exists "app_layout_version" cascade;`);

    this.addSql(`drop table if exists "app_push_campaign" cascade;`);

    this.addSql(`drop table if exists "app_push_token" cascade;`);

    this.addSql(`drop table if exists "app_story" cascade;`);
  }

}
