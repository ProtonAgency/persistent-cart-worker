import { RouteProps } from '../router'
import { parse } from 'cookie'
import { uuid } from '@cfworker/uuid'
import createResponse from '../utils/response'
import loadCart from '../utils/load-cart'
import buildHeaders from '../utils/build-headers'
import { generateCart } from '../utils/cart'

const COOKIE_NAME = '__ctoken'
const MAX_AGE = 31_536_000 // one year

const generateCookieValue = (cartToken: string): string =>
  `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`

export async function viewCart({ request, event }: RouteProps): Promise<Response> {
  const cookie = parse(request.headers.get('Cookie') || '')
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const response = fetch(request)
  try {
    const cart = await loadCart(cartToken)
    const headers = new Headers({ 'Set-Cookie': generateCookieValue(cartToken) })
    if (cart.item_count > 0) {
      const { cart: newCart, headers: addResponseHeaders } = await generateCart(request, cart, cartToken)
      event.waitUntil(CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: MAX_AGE }))
      addResponseHeaders.getAll('Set-Cookie').forEach((c) => headers.append('Set-Cookie', c))
    }
  } catch (e) {
    null
  }
  return response
}

export async function fetchCart({ request }: RouteProps): Promise<Response> {
  const cookie = parse(request.headers.get('Cookie') || '')
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  return loadCart(cartToken).then((cart) =>
    createResponse(
      cart,
      { 'Set-Cookie': generateCookieValue(cartToken) },
      200,
      new URL(request.url).hostname,
    ),
  )
}

export async function addItem({ request, event }: RouteProps): Promise<Response> {
  const cookie = parse(request.headers.get('Cookie') || '')
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  const payload: { items: CartItem[] } = await request.json()

  if (payload.items.some((it) => !it.id || !it.quantity)) {
    return createResponse(
      { error: 'Missing `id` or `quantity`' },
      {},
      409,
      new URL(request.url).hostname,
    )
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
    return createResponse(JSON.parse(message), {}, 409, new URL(request.url).hostname)
  }

  event.waitUntil(CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: MAX_AGE }))

  const newHeaders = new Headers(addResponseHeaders || {})
  newHeaders.append('Set-Cookie', generateCookieValue(cartToken))

  return createResponse(newCart, newHeaders, 200, new URL(request.url).hostname)
}

export async function updateItem({ request, event }: RouteProps): Promise<Response> {
  const cookie = parse(request.headers.get('Cookie') || '')
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  const payload: { id: number | string; quantity: number } = await request.json()
  if (!payload.id || typeof payload.quantity !== 'number') {
    return createResponse(
      { error: 'Missing `id` or `quantity`' },
      {},
      409,
      new URL(request.url).hostname,
    )
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
    return createResponse(JSON.parse(message), {}, 409, new URL(request.url).hostname)
  }

  event.waitUntil(CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: MAX_AGE }))

  const newHeaders = new Headers(addResponseHeaders || {})
  newHeaders.append('Set-Cookie', generateCookieValue(cartToken))

  return createResponse(newCart, newHeaders, 200, new URL(request.url).hostname)
}

export async function updateCart({ request, event }: RouteProps): Promise<Response> {
  const host = new URL(request.url).hostname
  const cookie = parse(request.headers.get('Cookie') || '')
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  const payload: {
    attributes: { [key: string]: string } | undefined | null
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
    return createResponse(JSON.parse(message), {}, 409, new URL(request.url).hostname)
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

  event.waitUntil(CART_STORE.put(cartToken, JSON.stringify(newCart), { expirationTtl: MAX_AGE }))

  const newHeaders = new Headers(addResponseHeaders || {})
  newHeaders.append('Set-Cookie', generateCookieValue(cartToken))

  return createResponse(newCart, newHeaders, 200, new URL(request.url).hostname)
}

export async function clearCart({ request, event }: RouteProps): Promise<Response> {
  const host = new URL(request.url).hostname
  const cookie = parse(request.headers.get('Cookie') || '')
  const oldCartToken = cookie[COOKIE_NAME] ?? uuid()
  const newCartToken = uuid()

  event.waitUntil(CART_STORE.delete(oldCartToken))

  return fetch(`https://${host}/cart/clear.js`, {
    headers: buildHeaders(request),
  }).then(() =>
    loadCart(newCartToken).then((cart) =>
      createResponse(
        cart,
        { 'Set-Cookie': generateCookieValue(newCartToken) },
        200,
        new URL(request.url).hostname,
      ),
    ),
  )
}
