import { MedusaService } from "@medusajs/framework/utils"
import AppLayout from "./models/app-layout"
import AppLayoutVersion from "./models/app-layout-version"
import PushCampaign from "./models/push-campaign"
import ProductReview from "./models/product-review"
import PushToken from "./models/push-token"
import Story from "./models/story"
import Tenant from "./models/tenant"

class AppContentModuleService extends MedusaService({
  AppLayout,
  AppLayoutVersion,
  Story,
  PushToken,
  PushCampaign,
  ProductReview,
  Tenant,
}) {}

export default AppContentModuleService
