import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Redis is used for sessions/events in production when REDIS_URL is set
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  admin: {
    // Public address of the server, used by the admin dashboard in production
    backendUrl: process.env.BACKEND_PUBLIC_URL || "/",
  },
  modules: [
    // Production: events, workflows and locks go through Redis (survive restarts, safe with several instances)
    ...(process.env.REDIS_URL
      ? [
          { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl: process.env.REDIS_URL } },
          { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl: process.env.REDIS_URL } } },
          {
            resolve: "@medusajs/medusa/locking",
            options: { providers: [{ resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl: process.env.REDIS_URL } }] },
          },
        ]
      : []),
    // App builder (server-driven UI), stories and push notifications
    { resolve: "./src/modules/app_content" },
    // Uploaded files (product images, stories, APKs). FILE_BACKEND_URL must be the
    // public address of the server in production, e.g. https://api.example.com/static
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: { backend_url: process.env.FILE_BACKEND_URL || "http://localhost:9000/static" },
          },
        ],
      },
    },
  ],
})
