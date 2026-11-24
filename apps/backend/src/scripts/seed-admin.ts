import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (server environment).
 * Safe to run on every deploy: does nothing once that admin exists.
 */
export default async function seedAdmin({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    logger.info("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin creation")
    return
  }
  const users = container.resolve(Modules.USER)
  const [existing] = await users.listUsers({ email })
  if (existing) {
    logger.info(`Admin ${email} already exists`)
    return
  }
  const auth = container.resolve(Modules.AUTH)
  const { authIdentity, success, error } = await auth.register("emailpass", { body: { email, password } })
  if (!success || !authIdentity) throw new Error(error ?? "Could not create the admin login")
  await createUserAccountWorkflow(container).run({ input: { authIdentityId: authIdentity.id, userData: { email } } })
  logger.info(`Admin ${email} created`)
}
