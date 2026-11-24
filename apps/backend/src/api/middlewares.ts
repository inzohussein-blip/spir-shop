import { configureStoreSearch, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import {
  CreateStorySchema,
  PublishLayoutSchema,
  CreateReviewSchema,
  AppUploadSchema,
  CreateTenantSchema,
  UpdateTenantSchema,
  AppFeedbackSchema,
  RegisterPushTokenSchema,
  RollbackLayoutSchema,
  SaveAppSettingsSchema,
  UpdateReviewSchema,
  SaveLayoutSchema,
  SendCampaignSchema,
  UpdateStorySchema,
} from "./app-content-validators"

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    {
      methods: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    // App builder (server-driven UI)
    {
      methods: ["POST"],
      matcher: "/admin/app-layouts/:page",
      middlewares: [validateAndTransformBody(SaveLayoutSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/admin/app-layouts/:page/publish",
      middlewares: [validateAndTransformBody(PublishLayoutSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/admin/app-layouts/:page/rollback",
      middlewares: [validateAndTransformBody(RollbackLayoutSchema)],
    },
    // Stories
    {
      methods: ["POST"],
      matcher: "/admin/app-stories",
      middlewares: [validateAndTransformBody(CreateStorySchema)],
    },
    {
      methods: ["POST"],
      matcher: "/admin/app-stories/:id",
      middlewares: [validateAndTransformBody(UpdateStorySchema)],
    },
    // Push notifications
    {
      methods: ["POST"],
      matcher: "/admin/app-push/campaigns",
      middlewares: [validateAndTransformBody(SendCampaignSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/push-tokens",
      middlewares: [validateAndTransformBody(RegisterPushTokenSchema)],
    },
    // App settings, reviews
    {
      methods: ["POST"],
      matcher: "/admin/app-settings",
      middlewares: [validateAndTransformBody(SaveAppSettingsSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/app-reviews",
      middlewares: [validateAndTransformBody(CreateReviewSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/admin/app-tenants",
      middlewares: [validateAndTransformBody(CreateTenantSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/admin/app-tenants/:id",
      middlewares: [validateAndTransformBody(UpdateTenantSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/app-uploads",
      // up to 4 photos of ~3MB each, base64 encoded
      bodyParser: { sizeLimit: "18mb" },
      middlewares: [validateAndTransformBody(AppUploadSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/app-feedback",
      middlewares: [validateAndTransformBody(AppFeedbackSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/admin/app-reviews/:id",
      middlewares: [validateAndTransformBody(UpdateReviewSchema)],
    },
  ],
})
