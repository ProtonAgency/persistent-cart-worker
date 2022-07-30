import { uuid } from '@cfworker/uuid'

export default async function loadCart(token: string): Promise<Cart> {
  return (
    (token === 'no-cart' ? null : await CART_STORE.get(token, 'json')) || {
      token: token === 'no-cart' ? uuid() : token,
      note: null,
      attributes: {},
      original_total_price: 0,
      total_price: 0,
      total_discount: 0,
      total_weight: 0,
      item_count: 0,
      items: [],
      requires_shipping: false,
      currency: 'USD',
      items_subtotal_price: 0,
      cart_level_discount_applications: [],
    }
  )
}
