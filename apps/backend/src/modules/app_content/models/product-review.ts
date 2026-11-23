import { model } from "@medusajs/framework/utils"

/**
 * Product review from a customer who ordered the product (verified purchase).
 * New reviews are visible right away; the admin can hide or delete them.
 */
const ProductReview = model
  .define("app_product_review", {
    id: model.id({ prefix: "prev" }).primaryKey(),
    product_id: model.text().index(),
    order_id: model.text(),
    rating: model.number(),
    name: model.text(),
    comment: model.text().nullable(),
    /** photo URLs uploaded with the review */
    images: model.json().nullable(),
    status: model.enum(["approved", "hidden"]).default("approved"),
  })
  .indexes([{ on: ["order_id", "product_id"], unique: true }])

export default ProductReview
