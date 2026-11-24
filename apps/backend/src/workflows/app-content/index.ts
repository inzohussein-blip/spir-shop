import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import type { AppBlock } from "../../lib/app-blocks"
import {
  Audience,
  createStoryStep,
  deleteStoryStep,
  getLayoutVersionStep,
  publishLayoutStep,
  PushTokenInput,
  saveLayoutDraftStep,
  sendPushStep,
  StoryInput,
  updateStoryStep,
  upsertPushTokenStep,
} from "./steps"

export const saveAppLayoutDraftWorkflow = createWorkflow(
  "save-app-layout-draft",
  (input: { tenant_id: string; page: string; blocks: AppBlock[] }) => {
    const layout = saveLayoutDraftStep(input)
    return new WorkflowResponse(layout)
  }
)

/** Publish the current draft, or the given blocks, as a new live version. */
export const publishAppLayoutWorkflow = createWorkflow(
  "publish-app-layout",
  (input: { tenant_id: string; page: string; blocks?: AppBlock[] }) => {
    const layout = publishLayoutStep(input)
    return new WorkflowResponse(layout)
  }
)

/** Re-publish an older version (creates a new version with the old blocks). */
export const rollbackAppLayoutWorkflow = createWorkflow(
  "rollback-app-layout",
  (input: { tenant_id: string; page: string; version: number }) => {
    const blocks = getLayoutVersionStep(input)
    const layout = publishLayoutStep({ tenant_id: input.tenant_id, page: input.page, blocks })
    return new WorkflowResponse(layout)
  }
)

export const createStoryWorkflow = createWorkflow("create-story", (input: StoryInput) => {
  return new WorkflowResponse(createStoryStep(input))
})

export const updateStoryWorkflow = createWorkflow(
  "update-story",
  (input: StoryInput & { id: string }) => {
    return new WorkflowResponse(updateStoryStep(input))
  }
)

export const deleteStoryWorkflow = createWorkflow("delete-story", (input: { id: string }) => {
  return new WorkflowResponse(deleteStoryStep(input.id))
})

export const registerPushTokenWorkflow = createWorkflow(
  "register-push-token",
  (input: PushTokenInput) => {
    return new WorkflowResponse(upsertPushTokenStep(input))
  }
)

export const sendPushCampaignWorkflow = createWorkflow(
  "send-push-campaign",
  (input: {
    tenant_id: string
    kind: "campaign" | "abandoned_cart"
    title: string
    body: string
    link?: string | null
    audience?: Audience | null
  }) => {
    return new WorkflowResponse(sendPushStep(input))
  }
)
