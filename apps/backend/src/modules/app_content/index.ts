import { Module } from "@medusajs/framework/utils"
import AppContentModuleService from "./service"

export const APP_CONTENT_MODULE = "app_content"

export default Module(APP_CONTENT_MODULE, {
  service: AppContentModuleService,
})
