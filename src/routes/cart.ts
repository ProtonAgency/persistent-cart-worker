import { RouteProps } from '../router'
import createResponse from '../utils/response'
import buildHeaders from '../utils/build-headers'
import { generateCart, loadCart, loadCartFromOrigin } from '../utils/cart'
import config from '../../cart.config'
import { generateCookieValue } from '../utils/cookie'
import useRequest from '../utils/request'

export async function viewCart({ request, event }: RouteProps): Promise<Response> {
  const { cartToken } = await useRequest(request)

  const response = fetch(request)
  try {
    const cart = await loadCart(cartToken)
    const headers = new Headers({ 'Set-Cookie': await generateCookieValue(cartToken) })
    if (cart.item_count > 0) {
      const { cart: newCart, headers: addResponseHeaders } = await generateCart(request, cart, cartToken)
      event.waitUntil(
        CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: config.cookie.expiration }),
      )
      addResponseHeaders.getAll('Set-Cookie').forEach((c) => headers.append('Set-Cookie', c))
    }
  } catch (e) {
    null
  }
  return response
}

export async function fetchCart({ request, event }: RouteProps): Promise<Response> {
  const { cartToken } = await useRequest(request)

  const cart = await loadCart(cartToken)
  if (config.cart.loading.background && cart.item_count === 0) {
    event.waitUntil(
      (async () => {
        const originCart = await loadCartFromOrigin(request)
        if (originCart.item_count > 0) {
          await CART_STORE.put(cartToken, JSON.stringify(originCart))
        }
      })(),
    )
  }

  return createResponse(cart, { 'Set-Cookie': await generateCookieValue(cartToken) }, 200)
}

export async function addItem({ request, event }: RouteProps): Promise<Response> {
  const { cartToken } = await useRequest(request)
  const cart = await loadCart(cartToken)

  const payload: { items: CartItem[] } = await request.json()

  if (payload.items.some((it) => !it.id || !it.quantity)) {
    return createResponse({ error: 'Missing `id` or `quantity`' }, {}, 409)
  }

  const {
    cart: newCart,
    headers: addResponseHeaders,
    message,
  } = await generateCart(request, cart, cartToken, payload.items).catch((e) => {
    return {
      message: e.message,
      cart: null,
      headers: null,
    }
  })

  if (message) {
    return createResponse(JSON.parse(message), {}, 409)
  }

  event.waitUntil(
    CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: config.cookie.expiration }),
  )

  const newHeaders = new Headers(addResponseHeaders || {})
  newHeaders.append('Set-Cookie', await generateCookieValue(cartToken))

  return createResponse(newCart, newHeaders, 200)
}

export async function updateItem({ request, event }: RouteProps): Promise<Response> {
  const { cartToken } = await useRequest(request)
  const cart = await loadCart(cartToken)

  const payload: { id: number | string; quantity: number } = await request.json()
  if (!payload.id || typeof payload.quantity !== 'number') {
    return createResponse({ error: 'Missing `id` or `quantity`' }, {}, 409)
  }
  cart.items = cart.items.map((it) => {
    it.quantity = it.key === payload.id ? payload.quantity : it.quantity
    return it
  })
  const {
    cart: newCart,
    headers: addResponseHeaders,
    message,
  } = await generateCart(request, cart, cartToken).catch((e) => {
    return {
      message: e.message,
      cart: null,
      headers: null,
    }
  })

  if (message) {
    return createResponse(JSON.parse(message), {}, 409)
  }

  event.waitUntil(
    CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: config.cookie.expiration }),
  )

  const newHeaders = new Headers(addResponseHeaders || {})
  newHeaders.append('Set-Cookie', await generateCookieValue(cartToken))

  return createResponse(newCart, newHeaders, 200)
}

export async function updateCart({ request, event }: RouteProps): Promise<Response> {
  const { host, cartToken } = await useRequest(request)
  const cart = await loadCart(cartToken)

  const payload: {
    attributes: KeyValueObject | undefined | null
    note: string | undefined | null
  } = await request.json()

  const { headers: addResponseHeaders, message } = await generateCart(request, cart, cartToken).catch(
    (e) => {
      return {
        message: e.message,
        cart: null,
        headers: null,
      }
    },
  )

  if (message) {
    return createResponse(JSON.parse(message), {}, 409)
  }

  // add token property
  const addTokenResponse = await fetch(`https://${host}/cart/update.js`, {
    method: 'POST',
    body: JSON.stringify({
      note: payload.note || cart.note,
      attributes: {
        'x-cart-id': cartToken,
        ...payload.attributes,
      },
    }),
    headers: {
      ...buildHeaders(request, (addResponseHeaders || new Headers()).getAll('Set-Cookie').join(', ')),
      'content-type': 'application/json',
    },
  })

  const json: Cart = await addTokenResponse.json()
  const newCart = {
    ...json,
    token: cart.token,
  }

  event.waitUntil(
    CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: config.cookie.expiration }),
  )

  const newHeaders = new Headers(addResponseHeaders || {})
  newHeaders.append('Set-Cookie', await generateCookieValue(cartToken))

  return createResponse(newCart, newHeaders, 200)
}

export async function clearCart({ request, event }: RouteProps): Promise<Response> {
  const { host, cartToken: oldCartToken } = await useRequest(request)
  const newCartToken = config.cookie.generator()

  event.waitUntil(CART_STORE.delete(oldCartToken))

  return fetch(`https://${host}/cart/clear.js`, {
    headers: buildHeaders(request),
  }).then(() =>
    loadCart(newCartToken).then((cart) =>
      createResponse(cart, { 'Set-Cookie': generateCookieValue(newCartToken) }, 200),
    ),
  )
}
