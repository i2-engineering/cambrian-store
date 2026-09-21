import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const amazonPrice = product.metadata?.amazon_price_usd
  const amazonUrl =
    product.metadata?.style_number === "1071A124.100"
      ? "https://www.amazon.com/dp/B0FV57MD64"
      : product.metadata?.amazon_url
  const checkedAt = product.metadata?.comparison_checked_at

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {typeof amazonPrice === "number" && typeof amazonUrl === "string" && (
          <div className="rounded-xl border-2 border-ui-border-strong bg-ui-bg-subtle px-6 py-5 text-center shadow-elevation-card-rest">
            <Text className="text-sm font-semibold uppercase tracking-widest text-ui-fg-subtle">
              Amazon price
            </Text>
            <a
              href={amazonUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-4xl font-bold leading-tight text-ui-fg-base line-through decoration-2 underline-offset-4 hover:underline"
            >
              ${amazonPrice.toFixed(2)}
            </a>
            {typeof checkedAt === "string" && (
              <Text className="mt-2 text-xs text-ui-fg-muted">
                Compared {checkedAt}
              </Text>
            )}
          </div>
        )}

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
