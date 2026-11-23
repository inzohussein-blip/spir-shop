import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { APP_CONTENT_MODULE } from "../../modules/app_content"
import type AppContentModuleService from "../../modules/app_content/service"
import { AppBlock, defaultBlocksFor } from "../../lib/app-blocks"
import { isExpoPushToken, PushMessage, sendExpoPush } from "../../lib/expo-push"

type Layout = {
  id: string
  page: string
  draft: { blocks: AppBlock[] }
  published: { blocks: AppBlock[] } | null
  version: number
  published_at: Date | null
}

const service = (container: { resolve: (k: string) => unknown }) =>
  container.resolve(APP_CONTENT_MODULE) as AppContentModuleService

async function findLayout(svc: AppContentModuleService, page: string) {
  const [layout] = await svc.listAppLayouts({ page })
  return layout as unknown as Layout | undefined
}

/* ------------------------------- layouts ------------------------------- */

type DraftCompensation = { id: string; draft: Record<string, unknown> | null }

export const saveLayoutDraftStep = createStep(
  "save-layout-draft",
  async (input: { page: string; blocks: AppBlock[] }, { container }) => {
    const svc = service(container)
    const existing = await findLayout(svc, input.page)
    if (existing) {
      const updated = await svc.updateAppLayouts({ id: existing.id, draft: { blocks: input.blocks } })
      const comp: DraftCompensation = { id: existing.id, draft: existing.draft }
      return new StepResponse(updated, comp)
    }
    const created = await svc.createAppLayouts({ page: input.page, draft: { blocks: input.blocks } })
    const comp: DraftCompensation = { id: created.id, draft: null }
    return new StepResponse(created, comp)
  },
  async (prev: DraftCompensation | undefined, { container }) => {
    if (!prev) return
    const svc = service(container)
    if (prev.draft === null) {
      await svc.deleteAppLayouts(prev.id)
    } else {
      await svc.updateAppLayouts({ id: prev.id, draft: prev.draft })
    }
  }
)

/** Publishes `blocks` (or the current draft) as a new version and records a snapshot. */
export const publishLayoutStep = createStep(
  "publish-layout",
  async (input: { page: string; blocks?: AppBlock[] }, { container }) => {
    const svc = service(container)
    let layout = await findLayout(svc, input.page)
    if (!layout) {
      layout = (await svc.createAppLayouts({
        page: input.page,
        draft: { blocks: input.blocks ?? defaultBlocksFor(input.page) },
      })) as unknown as Layout
    }
    const blocks = input.blocks ?? layout.draft.blocks
    const version = (layout.version ?? 0) + 1
    const previous = { published: layout.published, version: layout.version, published_at: layout.published_at }

    const updated = await svc.updateAppLayouts({
      id: layout.id,
      draft: { blocks },
      published: { blocks },
      version,
      published_at: new Date(),
    })
    const snapshot = await svc.createAppLayoutVersions({
      page: input.page,
      version,
      // stored as a JSON array
      blocks: blocks as unknown as Record<string, unknown>,
    })
    return new StepResponse(updated, { id: layout.id, previous, snapshotId: snapshot.id })
  },
  async (prev, { container }) => {
    if (!prev) return
    const svc = service(container)
    await svc.deleteAppLayoutVersions(prev.snapshotId)
    await svc.updateAppLayouts({ id: prev.id, ...prev.previous })
  }
)

export const getLayoutVersionStep = createStep(
  "get-layout-version",
  async (input: { page: string; version: number }, { container }) => {
    const svc = service(container)
    const [snapshot] = await svc.listAppLayoutVersions({ page: input.page, version: input.version })
    if (!snapshot) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Version ${input.version} of "${input.page}" not found`
      )
    }
    return new StepResponse(snapshot.blocks as unknown as AppBlock[])
  }
)

/* ------------------------------- stories ------------------------------- */

export type StoryInput = {
  title?: string
  media_url?: string
  media_type?: "image" | "video"
  thumbnail_url?: string | null
  link?: string | null
  cta_label?: string | null
  rank?: number
  is_active?: boolean
  starts_at?: Date | null
  expires_at?: Date | null
}

export const createStoryStep = createStep(
  "create-story",
  async (input: StoryInput, { container }) => {
    const story = await service(container).createStories(input as never)
    return new StepResponse(story, story.id)
  },
  async (id, { container }) => {
    if (id) await service(container).deleteStories(id)
  }
)

export const updateStoryStep = createStep(
  "update-story",
  async (input: StoryInput & { id: string }, { container }) => {
    const svc = service(container)
    const before = await svc.retrieveStory(input.id)
    const story = await svc.updateStories(input as never)
    return new StepResponse(story, before)
  },
  async (before, { container }) => {
    if (before) await service(container).updateStories(before as never)
  }
)

export const deleteStoryStep = createStep(
  "delete-story",
  async (id: string, { container }) => {
    await service(container).softDeleteStories(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (id) await service(container).restoreStories(id)
  }
)

/* -------------------------------- push --------------------------------- */

export type PushTokenInput = {
  token: string
  platform: string
  cart_id?: string | null
  customer_id?: string | null
  province?: string | null
  /** An order placed from this device (merged into order_ids) */
  order_id?: string | null
}

type TokenCompensation = { id: string; before: Record<string, unknown> | null }

export const upsertPushTokenStep = createStep(
  "upsert-push-token",
  async (input: PushTokenInput, { container }) => {
    const svc = service(container)
    const [existing] = await svc.listPushTokens({ token: input.token })
    const { order_id, ...rest } = input
    const known = ((existing?.order_ids as unknown as string[] | null) ?? []).slice(-49)
    const orderIds = order_id && !known.includes(order_id) ? [...known, order_id] : known
    const data = {
      ...rest,
      order_ids: orderIds as unknown as Record<string, unknown>,
      enabled: true,
      last_seen_at: new Date(),
    }
    if (existing) {
      const updated = await svc.updatePushTokens({ id: existing.id, ...data })
      const comp: TokenCompensation = { id: existing.id, before: existing }
      return new StepResponse(updated, comp)
    }
    const created = await svc.createPushTokens(data)
    const comp: TokenCompensation = { id: created.id, before: null }
    return new StepResponse(created, comp)
  },
  async (prev: TokenCompensation | undefined, { container }) => {
    if (!prev) return
    const svc = service(container)
    if (prev.before) {
      await svc.updatePushTokens(prev.before as never)
    } else {
      await svc.deletePushTokens(prev.id)
    }
  }
)

export type Audience = { province?: string | null; token_ids?: string[] }

export const sendPushStep = createStep(
  "send-push",
  async (
    input: {
      kind: "campaign" | "abandoned_cart"
      title: string
      body: string
      link?: string | null
      audience?: Audience | null
    },
    { container }
  ) => {
    const svc = service(container)
    const filters: Record<string, unknown> = { enabled: true }
    if (input.audience?.province) filters.province = input.audience.province
    if (input.audience?.token_ids?.length) filters.id = input.audience.token_ids

    const tokens = (await svc.listPushTokens(filters, { take: 100000 })).filter((t) =>
      isExpoPushToken(t.token)
    )

    const messages: PushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: input.title,
      body: input.body,
      data: input.link ? { url: input.link } : {},
    }))
    const result = messages.length ? await sendExpoPush(messages) : { sent: 0, failed: 0, invalidTokens: [] }

    if (result.invalidTokens.length) {
      const invalid = tokens.filter((t) => result.invalidTokens.includes(t.token))
      await svc.updatePushTokens(invalid.map((t) => ({ id: t.id, enabled: false })))
    }

    const campaign = await svc.createPushCampaigns({
      kind: input.kind,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      audience: (input.audience ?? null) as Record<string, unknown> | null,
      status: result.sent > 0 || messages.length === 0 ? "sent" : "failed",
      sent_count: result.sent,
      failed_count: result.failed,
      sent_at: new Date(),
    })
    // Notifications can't be recalled, so there is nothing to compensate.
    return new StepResponse(campaign)
  }
)
