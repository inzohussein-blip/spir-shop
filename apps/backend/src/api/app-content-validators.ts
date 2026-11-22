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
})

export type SaveLayoutBody = z.infer<typeof SaveLayoutSchema>
export type PublishLayoutBody = z.infer<typeof PublishLayoutSchema>
export type RollbackLayoutBody = z.infer<typeof RollbackLayoutSchema>
export type CreateStoryBody = z.infer<typeof CreateStorySchema>
export type UpdateStoryBody = z.infer<typeof UpdateStorySchema>
export type SendCampaignBody = z.infer<typeof SendCampaignSchema>
export type RegisterPushTokenBody = z.infer<typeof RegisterPushTokenSchema>
