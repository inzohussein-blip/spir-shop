import { MedusaContainer } from "@medusajs/framework";
import { DEFAULT_REGION_STORE_POLICIES } from "../lib/region-store-policies";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Initial data for Spir Shop (Iraq): IQD currency, Iraq region with
 * cash-on-delivery (pp_system_default), Baghdad / provinces delivery options,
 * cosmetics categories and a few sample products.
 *
 * Prices are in whole Iraqi dinars (IQD has no minor unit).
 */
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  logger.info("Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        { name: "المتجر الإلكتروني", description: "Web, mobile app & Telegram" },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        { title: "Storefront Publishable Key", type: "publishable", created_by: "" },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableApiKey.id, add: [defaultSalesChannel.id] },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Spir Shop",
          supported_currencies: [
            { currency_code: "iqd", is_default: true },
            { currency_code: "usd", is_default: false },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const {
    result: [region],
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "العراق",
          currency_code: "iqd",
          countries: ["iq"],
          // pp_system_default = الدفع عند الاستلام (Cash on Delivery)
          payment_providers: ["pp_system_default"],
          metadata: DEFAULT_REGION_STORE_POLICIES,
        },
      ],
    },
  });

  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "iq", provider_id: "tp_system" }],
  });

  logger.info("Seeding stock location data...");
  const {
    result: [stockLocation],
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "مخزن بغداد",
          address: { city: "Baghdad", country_code: "IQ", address_1: "" },
        },
      ],
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  logger.info("Seeding fulfillment data...");
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "توصيل داخل العراق",
    type: "shipping",
    service_zones: [
      { name: "العراق", geo_zones: [{ country_code: "iq", type: "country" }] },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ];

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "توصيل بغداد",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "بغداد", description: "خلال 24 ساعة", code: "baghdad" },
        prices: [
          { currency_code: "iqd", amount: 5000 },
          { region_id: region.id, amount: 5000 },
        ],
        rules: storeRules,
      },
      {
        name: "توصيل المحافظات",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "المحافظات", description: "خلال 2-3 أيام", code: "provinces" },
        prices: [
          { currency_code: "iqd", amount: 7000 },
          { region_id: region.id, amount: 7000 },
        ],
        rules: storeRules,
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [defaultSalesChannel.id] },
  });

  logger.info("Seeding product data...");
  const categoryNames = ["العناية بالبشرة", "المكياج", "العناية بالشعر", "العطور", "العناية بالجسم"];
  const { result: categories } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: categoryNames.map((name) => ({ name, is_active: true })),
    },
  });
  const cat = (name: string) => categories.find((c) => c.name === name)!.id;

  const {
    result: [sizeOption],
  } = await createProductOptionsWorkflow(container).run({
    input: {
      product_options: [{ title: "الحجم", values: ["30ml", "50ml", "100ml", "قياسي"] }],
    },
  });

  // Link only the sizes each product actually has (otherwise every size shows on every product)
  const sizes = (...values: string[]) => [
    {
      id: sizeOption.id,
      value_ids: (sizeOption.values ?? [])
        .filter((v) => values.includes(v.value))
        .map((v) => v.id),
    },
  ]

  const single = (sku: string, price: number) => [
    {
      title: "قياسي",
      sku,
      options: { "الحجم": "قياسي" },
      prices: [{ amount: price, currency_code: "iqd" }],
    },
  ];

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "سيروم فيتامين C",
          handle: "vitamin-c-serum",
          description: "سيروم مضاد للأكسدة لتفتيح البشرة وتوحيد لونها. مناسب لجميع أنواع البشرة.",
          category_ids: [cat("العناية بالبشرة")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: sizes("30ml", "50ml"),
          variants: [
            { title: "30ml", sku: "VITC-30", options: { "الحجم": "30ml" }, prices: [{ amount: 25000, currency_code: "iqd" }] },
            { title: "50ml", sku: "VITC-50", options: { "الحجم": "50ml" }, prices: [{ amount: 35000, currency_code: "iqd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "واقي شمس SPF 50",
          handle: "sunscreen-spf50",
          description: "واقي شمس خفيف بدون أثر أبيض، حماية واسعة الطيف UVA/UVB.",
          category_ids: [cat("العناية بالبشرة")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: sizes("50ml"),
          variants: [
            { title: "50ml", sku: "SPF50-50", options: { "الحجم": "50ml" }, prices: [{ amount: 18000, currency_code: "iqd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "أحمر شفاه مات",
          handle: "matte-lipstick",
          description: "أحمر شفاه بلمسة مات يدوم طويلاً ومرطب.",
          category_ids: [cat("المكياج")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: sizes("قياسي"),
          variants: single("LIP-MATTE", 12000),
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "زيت الأرغان للشعر",
          handle: "argan-hair-oil",
          description: "زيت أرغان مغربي طبيعي لتغذية الشعر الجاف والتالف.",
          category_ids: [cat("العناية بالشعر")],
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: sizes("100ml"),
          variants: [
            { title: "100ml", sku: "ARGAN-100", options: { "الحجم": "100ml" }, prices: [{ amount: 15000, currency_code: "iqd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  });

  logger.info("Seeding inventory levels.");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 100,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info("Finished seeding initial data.");
}
