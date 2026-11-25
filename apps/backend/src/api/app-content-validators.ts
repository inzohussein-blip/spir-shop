import { z } from "@medusajs/framework/zod"
import { AppLayoutBlocksSchema } from "../lib/app-blocks"

export const SaveLayoutSchema = z.object({ blocks: AppLayoutBlocksSchema })
export const PublishLayoutSchema = z.object({ blocks: AppLayoutBlocksSchema.optional() })
export const RollbackLayoutSchema = z.object({ version: z.number().int().positive() })

const link = z
  .string()
  .max(500)
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Link must start with / or http(s)://")

const optionalDate = z.coerce.date().nullable().optional()

export const CreateStorySchema = z.object({
  title: z.string().min(1).max(60),
  media_url: z.string().url(),
  media_type: z.enum(["image", "video"]).default("image"),
  thumbnail_url: z.string().url().nullable().optional(),
  link: link.nullable().optional(),
  cta_label: z.string().max(40).nullable().optional(),
  rank: z.number().int().default(0),
  is_active: z.boolean().default(true),
  starts_at: optionalDate,
  expires_at: optionalDate,
})
export const UpdateStorySchema = CreateStorySchema.partial()

export const SendCampaignSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(240),
  link: link.nullable().optional(),
  audience: z
    .object({ province: z.string().max(40).nullable().optional() })
    .nullable()
    .optional(),
})

export const RegisterPushTokenSchema = z.object({
  token: z.string().min(10).max(300),
  platform: z.enum(["ios", "android", "web"]),
  cart_id: z.string().max(100).nullable().optional(),
  province: z.string().max(40).nullable().optional(),
  order_id: z.string().max(100).nullable().optional(),
})

export const SaveAppSettingsSchema = z.object({
  free_shipping_threshold: z.number().int().min(0).max(10000000),
  whatsapp_number: z.string().max(30).default(""),
  telegram_username: z.string().max(60).default(""),
  support_phone: z.string().max(30).default(""),
  baghdad_eta: z.string().max(60),
  provinces_eta: z.string().max(60),
  trust_badges: z.array(z.string().min(1).max(40)).max(4),
  default_theme: z.enum(["elegant", "natural"]).default("elegant"),
})

export const CreateReviewSchema = z.object({
  product_id: z.string().min(1).max(100),
  order_id: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  name: z.string().min(1).max(60),
  comment: z.string().max(1000).nullable().optional(),
  images: z.array(z.string().url().max(500)).max(4).optional(),
})

/** Photos sent from the app (base64), e.g. with a review. Only for an existing order. */
export const AppUploadSchema = z.object({
  order_id: z.string().min(1).max(100),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(120),
        mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
        content: z.string().min(1).max(4_000_000),
      })
    )
    .min(1)
    .max(4),
})

/** "Rate this app" feedback from the app. */
export const AppFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  name: z.string().max(60).optional(),
  phone: z.string().max(30).optional(),
})

export const UpdateReviewSchema = z.object({ status: z.enum(["approved", "hidden"]) })

/* ------------------------------ stores ------------------------------ */

const BrandingSchema = z.object({
  app_name: z.string().max(60).optional(),
  logo_url: z.string().max(500).optional(),
  theme: z.enum(["elegant", "natural"]).optional(),
  accent_color: z.string().max(20).optional(),
})

const FeaturesSchema = z.object({
  wishlist: z.boolean().optional(),
  reviews: z.boolean().optional(),
  stories: z.boolean().optional(),
  coupons: z.boolean().optional(),
  brands: z.boolean().optional(),
  notifications: z.boolean().optional(),
  flash_sale: z.boolean().optional(),
})

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9-]+$/, "حروف إنكليزية صغيرة وأرقام وشرطة فقط"),
  owner_email: z.string().email().optional(),
  branding: BrandingSchema.optional(),
  features: FeaturesSchema.optional(),
})

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  owner_email: z.string().email().nullable().optional(),
  branding: BrandingSchema.optional(),
  features: FeaturesSchema.optional(),
})

export type CreateTenantBody = z.infer<typeof CreateTenantSchema>
export type UpdateTenantBody = z.infer<typeof UpdateTenantSchema>

export type SaveLayoutBody = z.infer<typeof SaveLayoutSchema>
export type PublishLayoutBody = z.infer<typeof PublishLayoutSchema>
export type RollbackLayoutBody = z.infer<typeof RollbackLayoutSchema>
export type CreateStoryBody = z.infer<typeof CreateStorySchema>
export type UpdateStoryBody = z.infer<typeof UpdateStorySchema>
export type SendCampaignBody = z.infer<typeof SendCampaignSchema>
export type RegisterPushTokenBody = z.infer<typeof RegisterPushTokenSchema>
export type SaveAppSettingsBody = z.infer<typeof SaveAppSettingsSchema>
export type CreateReviewBody = z.infer<typeof CreateReviewSchema>
export type UpdateReviewBody = z.infer<typeof UpdateReviewSchema>
export type AppUploadBody = z.infer<typeof AppUploadSchema>
export type AppFeedbackBody = z.infer<typeof AppFeedbackSchema>

/* ------------------------- manager app (admin) ------------------------- */

/** A simple product from the manager app: one price, photos, categories. */
export const AppProductSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(4000).nullable().optional(),
  price: z.number().min(0).max(1_000_000_000),
  status: z.enum(["published", "draft"]).default("published"),
  images: z.array(z.string().url().max(500)).max(10).default([]),
  category_ids: z.array(z.string().max(100)).max(10).optional(),
})
export const UpdateAppProductSchema = AppProductSchema.partial()

/** Photos from the manager app (products, ads, stories), base64 encoded. */
export const AdminAppUploadSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(120),
        mime_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
        content: z.string().min(1).max(6_000_000),
      })
    )
    .min(1)
    .max(6),
})

export type AppProductBody = z.infer<typeof AppProductSchema>
export type UpdateAppProductBody = z.infer<typeof UpdateAppProductSchema>
export type AdminAppUploadBody = z.infer<typeof AdminAppUploadSchema>
