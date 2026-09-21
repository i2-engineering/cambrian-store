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

const productHandle = "asics-gel-renma-2-white-menthol"

export default async function seedAsicsGelRenma2({ container }: ExecArgs) {
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
          metadata: {
            ...existingProducts[0].metadata,
            amazon_price_usd: 75.95,
            amazon_asin: "B0FV57MD64",
            amazon_url: "https://www.amazon.com/dp/B0FV57MD64",
            comparison_checked_at: "2026-09-20",
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
              prices: [{ amount: 69.95, currency_code: "usd" }],
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
      query.graph({
        entity: "sales_channel",
        fields: ["id", "name"],
      }),
      query.graph({
        entity: "shipping_profile",
        fields: ["id", "name"],
      }),
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
      input: {
        product_categories: [{ name: "Shoes", is_active: true }],
      },
    })
    categoryId = result[0].id
  }

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "ASICS GEL-Renma 2 Men's Pickleball Shoes",
          subtitle: "White/Menthol",
          handle: productHandle,
          description:
            "A supportive ASICS court shoe designed for quick lateral movement. The GEL-Renma 2 combines a flexible outsole, TRUSSTIC midsole support, and a wide wrap-up outsole for stable movement on the pickleball court.",
          status: ProductStatus.PUBLISHED,
          category_ids: [categoryId],
          shipping_profile_id: shippingProfiles[0].id,
          weight: 726,
          thumbnail:
            "https://www.holabirdsports.com/cdn/shop/files/370322_3.jpg?v=1763665838",
          images: [1, 2, 3, 4, 5, 6].map((imageNumber) => ({
            url: `https://www.holabirdsports.com/cdn/shop/files/370322_${imageNumber}.jpg?v=1763665838`,
          })),
          metadata: {
            amazon_price_usd: 75.95,
            amazon_asin: "B0FV57MD64",
            amazon_url: "https://www.amazon.com/dp/B0FV57MD64",
            comparison_checked_at: "2026-09-20",
            supplier: "Holabird Sports",
            supplier_cost_usd: 69.95,
            supplier_product_id: "370322",
            supplier_url:
              "https://www.holabirdsports.com/products/asics-gel-renma-2-white-menthol",
            style_number: "1071A124.100",
          },
          options: [
            { title: "Size", values: ["13"] },
            { title: "Width", values: ["D - Medium"] },
          ],
          variants: [
            {
              title: "13 / D - Medium",
              sku: "ASICS-1071A124-100-13-D",
              manage_inventory: false,
              options: {
                Size: "13",
                Width: "D - Medium",
              },
              prices: [{ amount: 69.95, currency_code: "usd" }],
              metadata: {
                supplier_barcode: "199023067715",
                supplier_variant_id: "45613238517950",
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
