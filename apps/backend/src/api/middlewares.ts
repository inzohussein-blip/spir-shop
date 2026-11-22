import { configureStoreSearch, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import {
  CreateStorySchema,
  PublishLayoutSchema,
  RegisterPushTokenSchema,
  RollbackLayoutSchema,
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
  ],
})
