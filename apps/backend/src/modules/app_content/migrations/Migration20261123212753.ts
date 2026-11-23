import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261123212753 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "app_product_review" add column if not exists "images" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "app_product_review" drop column if exists "images";`);
  }

}
