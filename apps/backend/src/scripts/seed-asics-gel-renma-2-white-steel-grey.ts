import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateProductVariantsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

const productHandle = "asics-gel-renma-2-white-steel-grey"
const amazonPrice = 89.95
const cambrianPrice = 76.82
const supplierUrl =
  "https://shopvnb.com/giay-cau-long-asics-gel-renma-2-men.html?active=28012"
const imageUrls = [
  "https://cdn.shopvnb.com/uploads/gallery/1giay-cau-long-asics-gel-renma-2-men-white-steel-grey-chinh-hang-1071a124-101_1786757106.webp",
  "https://cdn.shopvnb.com/uploads/gallery/2giay-cau-long-asics-gel-renma-2-men-white-steel-grey-chinh-hang-1071a124-101_1786757112.webp",
  "https://cdn.shopvnb.com/uploads/gallery/3giay-cau-long-asics-gel-renma-2-men-white-steel-grey-chinh-hang-1071a124-101_1786757117.webp",
  "https://cdn.shopvnb.com/uploads/gallery/4giay-cau-long-asics-gel-renma-2-men-white-steel-grey-chinh-hang-1071a124-101_1786757124.webp",
  "https://cdn.shopvnb.com/uploads/gallery/5giay-cau-long-asics-gel-renma-2-men-white-steel-grey-chinh-hang-1071a124-101_1786757129.webp",
  "https://cdn.shopvnb.com/uploads/gallery/6giay-cau-long-asics-gel-renma-2-men-white-steel-grey-chinh-hang-1071a124-101_1786757139.webp",
]

const metadata = {
  amazon_price_usd: amazonPrice,
  amazon_asin: "B0G4X4F9BH",
  amazon_url: "https://www.amazon.com/dp/B0G4X4F9BH",
  comparison_checked_at: "2026-09-20",
  supplier: "ShopVNB",
  supplier_cost_original: "1,999,000 VND",
  supplier_cost_usd: cambrianPrice,
  supplier_url: supplierUrl,
  style_number: "1071A124.101",
}

export default async function seedAsicsGelRenma2WhiteSteelGrey({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "variants.id"],
    filters: { handle: productHandle },
  })

  if (existingProducts.length) {
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: existingProducts[0].id },
        update: {
          title: "ASICS GEL-Renma 2 Men's Pickleball Shoes",
          subtitle: "White/Steel Grey",
          thumbnail: imageUrls[0],
          images: imageUrls.map((url) => ({ url })),
          metadata: {
            ...existingProducts[0].metadata,
            ...metadata,
          },
        },
      },
    })

    const variantId = existingProducts[0].variants?.[0]?.id
    if (variantId) {
      await updateProductVariantsWorkflow(container).run({
        input: {
          product_variants: [
            {
              id: variantId,
              prices: [{ amount: cambrianPrice, currency_code: "usd" }],
            },
          ],
        },
      })
    }

    logger.info(`Updated local product: ${productHandle}`)
    return
  }

  const [{ data: salesChannels }, { data: shippingProfiles }] =
    await Promise.all([
      query.graph({ entity: "sales_channel", fields: ["id", "name"] }),
      query.graph({ entity: "shipping_profile", fields: ["id", "name"] }),
    ])

  if (!salesChannels.length || !shippingProfiles.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A sales channel and shipping profile are required before seeding this product."
    )
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    filters: { name: "Shoes" },
  })

  let categoryId = categories[0]?.id

  if (!categoryId) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [{ name: "Shoes", is_active: true }] },
    })
    categoryId = result[0].id
  }

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "ASICS GEL-Renma 2 Men's Pickleball Shoes",
          subtitle: "White/Steel Grey",
          handle: productHandle,
          description:
            "A supportive ASICS court shoe designed for quick lateral movement. The GEL-Renma 2 combines a flexible outsole, TRUSSTIC midsole support, and a wide wrap-up outsole for stable movement on the pickleball court.",
          status: ProductStatus.PUBLISHED,
          category_ids: [categoryId],
          shipping_profile_id: shippingProfiles[0].id,
          weight: 726,
          thumbnail: imageUrls[0],
          images: imageUrls.map((url) => ({ url })),
          metadata,
          options: [
            { title: "Size", values: ["10"] },
            { title: "Width", values: ["D - Medium"] },
          ],
          variants: [
            {
              title: "10 / D - Medium",
              sku: "ASICS-1071A124-101-10-D",
              manage_inventory: false,
              options: { Size: "10", Width: "D - Medium" },
              prices: [{ amount: cambrianPrice, currency_code: "usd" }],
              metadata: {
                supplier_size: "44 EU",
              },
            },
          ],
          sales_channels: salesChannels.map(({ id }) => ({ id })),
        },
      ],
    },
  })

  logger.info(`Created local product: ${productHandle}`)
}
