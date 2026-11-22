import { MedusaService } from "@medusajs/framework/utils"
import AppLayout from "./models/app-layout"
import AppLayoutVersion from "./models/app-layout-version"
import PushCampaign from "./models/push-campaign"
import PushToken from "./models/push-token"
import Story from "./models/story"

class AppContentModuleService extends MedusaService({
  AppLayout,
  AppLayoutVersion,
  Story,
  PushToken,
  PushCampaign,
}) {}

export default AppContentModuleService
