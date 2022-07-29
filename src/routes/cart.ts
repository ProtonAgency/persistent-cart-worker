import { RouteProps } from '../router'
import { parse } from 'cookie'
import { uuid } from '@cfworker/uuid'
import createResponse from '../utils/response'
import loadCart from '../utils/load-cart'

const COOKIE_NAME = '__ctoken' 
const MAX_AGE = 31_536_000 // one year

export async function fetchCart({ request }: RouteProps): Promise<Response> {
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  return createResponse(await loadCart(cartToken), {
    'Set-Cookie': `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`,
  }, 200)
}

export async function addItem({ request, event }: RouteProps): Promise<Response> {
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  // todo: add validation for the payload
  const payload = await request.json()

  // clear current shopify cart?
  await fetch('/cart/clear.js', request)
  await fetch('/cart/add.js', {
    body: JSON.stringify({
      items: [
        payload,
        ...cart.items.map(it => {
          return {
            id: it.id,
            quantity: it.quantity || 1,
            properties: it.properties || undefined,
          }
        }),
      ]
    }),
    headers: request.headers,
  })

  const json: Cart = await fetch('/cart.js', { headers: request.headers }).then(response => response.json())
  const newCart = {
    ...json,
    token: cart.token,
  }

  event.waitUntil(CART_STORE.put(cart.token, JSON.stringify(newCart)))
  
  return createResponse(cart, {
    'Set-Cookie': `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`,
  }, 200)
}

export async function updateItem({ request, event }: RouteProps): Promise<Response> {
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  // todo: check if GET/POST and get proper params
  // todo: remove/update item from array
  // todo: generate new shopify cart
  
  return createResponse(cart, {
    'Set-Cookie': `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`,
  }, 200)
}
