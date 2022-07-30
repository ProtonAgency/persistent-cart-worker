export {}

/**
 * Declare kv namespaces here so using them does not throw type errors
 */
declare global {
  const CART_STORE: KVNamespace
  interface CartItem {
    id: number //same as variant_id
    properties: { [key: string]: string } | null
    quantity: number
    variant_id: number
    key: string // variant_id:hash(unknown)
    title: string // product_title - variant_title
    price: number
    original_price: number
    discounted_price: number
    line_price: number
    original_line_price: number
    total_discount: number
    discounts: any[]
    sku: string
    grams: number
    vendor: string
    taxable: boolean
    product_id: number
    product_has_only_default_variant: boolean
    gift_card: boolean
    final_price: number
    final_line_price: number
    url: string
    featured_image: {
      aspect_ratio: number
      alt: string | null
      height: number
      url: string
      width: number
    }
    image: string
    handle: string
    requires_shipping: boolean
    product_type: string
    product_title: string
    product_description: string
    variant_title: string
    variant_options: string[]
    options_with_values: Array<{
      name: string
      value: string
    }>
    line_level_discount_allocations: any[]
    line_level_total_discount: number
  }

  interface Cart {
    token: string
    note: string | null
    attributes: { [key: string]: string } | null
    original_total_price: number
    total_price: number
    total_discount: number
    total_weight: number
    item_count: number
    items: CartItem[]
    requires_shipping: boolean
    currency: string
    items_subtotal_price: number
    cart_level_discount_applications: Array<any>
  }
}
