import { RouteProps } from '../router'
import { parse } from 'cookie'
import { uuid } from '@cfworker/uuid'
import createResponse from '../utils/response'
import loadCart from '../utils/load-cart'
import buildHeaders from '../utils/build-headers'

const COOKIE_NAME = '__ctoken'
const MAX_AGE = 31_536_000 // one year

export async function fetchCart({ request }: RouteProps): Promise<Response> {
  const host = (new URL(request.url)).hostname
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)
  const headers = new Headers({
    'Set-Cookie': `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`,
  });
  if (cart.item_count > 0) {
    const r = await fetch(`https://${host}/cart.js`, {
      headers: buildHeaders(request),
    })

    const json: Cart = await r.json()
    if (json.item_count !== cart.item_count) {
      await fetch(`https://${host}/cart/clear.js`, {
        headers: {
          ...buildHeaders(request),
        }
      })
    

      await fetch(`https://${host}/cart.js`, {
        headers: {
          ...buildHeaders(request),
        }
      })

      const addResponse = await fetch(`https://${host}/cart/add.js`, {
        method: 'POST',
        body: JSON.stringify({
          items: cart.items.map(it => {
            return {
              id: it.id,
              quantity: it.quantity,
              properties: it.properties || undefined,
            }
          }),
        }),
        headers: {
          ...buildHeaders(request, 'no-cookie'),
          'content-type': 'application/json',
        }
      })

      addResponse.headers.getAll('Set-Cookie').forEach(c => headers.append('Set-Cookie', c))
    }
  }

  return createResponse(cart, headers, 200)
}

export async function addItem({ request, event }: RouteProps): Promise<Response> {
  const host = (new URL(request.url)).hostname
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  // todo: add validation for the payload
  const payload: { items: CartItem[] } = await request.json()

  // clear current shopify cart
  await fetch(`https://${host}/cart/clear.js`, {
    headers: {
      ...buildHeaders(request),
    }
  })

  // add all items to cart (updates totals, discounts, etc)
  const addResponse = await fetch(`https://${host}/cart/add.js`, {
    method: 'POST',
    body: JSON.stringify({
      items: [
        ...payload.items,
        ...cart.items.map(it => {
          return {
            id: it.id,
            quantity: it.quantity || 1,
            properties: it.properties || undefined,
          }
        }),
      ]
    }),
    headers: {
      ...buildHeaders(request, 'no-cookie'),
      'content-type': 'application/json',
    }
  })

  // add token property
  const addTokenResponse = await fetch(`https://${host}/cart/update.js`, {
    method: 'POST',
    body: JSON.stringify({
      attributes: {
        'x-cart-id': cartToken,
      },
    }),
    headers: {
      ...buildHeaders(request, addResponse.headers.getAll('Set-Cookie').join(', ')),
      'content-type': 'application/json',
    }
  })

  const json: Cart = await addTokenResponse.json()
  const newCart = {
    ...json,
    token: cart.token,
  }

  event.waitUntil(CART_STORE.put(cartToken, JSON.stringify(newCart)))

  const newHeaders = new Headers(addResponse.headers)
  newHeaders.append('Set-Cookie', `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`)

  return createResponse(newCart, newHeaders, 200)
}

export async function updateItem({ request, event }: RouteProps): Promise<Response> {
  const host = (new URL(request.url)).hostname
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  // todo: validate payload
  const payload: { id: number | string, quantity: number | string } = await request.json()

  // clear current shopify cart 
  await fetch(`https://${host}/cart/clear.js`, {
    headers: {
      ...buildHeaders(request),
    }
  })

  await fetch(`https://${host}/cart.js`, {
    headers: {
      ...buildHeaders(request),
    }
  })

  // todo: remove cart cookie from request (causes dupe items)
  // add all items to cart (updates totals, discounts, etc)
  const addResponse = await fetch(`https://${host}/cart/add.js`, {
    method: 'POST',
    body: JSON.stringify({
      items: cart.items.map(it => {
        return {
          id: it.id,
          quantity: (it.key === payload.id) ? payload.quantity : it.quantity,
          properties: it.properties || undefined,
        }
      }),
    }),
    headers: {
      ...buildHeaders(request, 'no-cookie'),
      'content-type': 'application/json',
    }
  })

  // add token property
  const addTokenResponse = await fetch(`https://${host}/cart/update.js`, {
    method: 'POST',
    body: JSON.stringify({
      attributes: {
        'x-cart-id': cartToken,
      },
    }),
    headers: {
      ...buildHeaders(request, addResponse.headers.getAll('Set-Cookie').join(', ')),
      'content-type': 'application/json',
    }
  })

  const json: Cart = await addTokenResponse.json()
  const newCart = {
    ...json,
    token: cart.token,
  }

  event.waitUntil(CART_STORE.put(cartToken, JSON.stringify(newCart)))

  const newHeaders = new Headers(addResponse.headers)
  newHeaders.append('Set-Cookie', `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`)

  return createResponse(newCart, newHeaders, 200)
}

export async function updateCart({ request, event }: RouteProps): Promise<Response> {
  const host = (new URL(request.url)).hostname
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  const cart = await loadCart(cartToken)

  // todo: validate payload
  const payload: { attributes: any|undefined|null, note: string|undefined|null } = await request.json()

  // clear current shopify cart 
  await fetch(`https://${host}/cart/clear.js`, {
    headers: {
      ...buildHeaders(request),
    }
  })

  await fetch(`https://${host}/cart.js`, {
    headers: {
      ...buildHeaders(request),
    }
  })

  // add all items to cart (updates totals, discounts, etc)
  const addResponse = await fetch(`https://${host}/cart/add.js`, {
    method: 'POST',
    body: JSON.stringify({
      items: cart.items.map(it => {
        return {
          id: it.id,
          quantity: it.quantity,
          properties: it.properties || undefined,
        }
      }),
    }),
    headers: {
      ...buildHeaders(request, 'no-cookie'),
      'content-type': 'application/json',
    }
  })

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
      ...buildHeaders(request, addResponse.headers.getAll('Set-Cookie').join(', ')),
      'content-type': 'application/json',
    }
  })

  const json: Cart = await addTokenResponse.json()
  const newCart = {
    ...json,
    token: cart.token,
  }

  event.waitUntil(CART_STORE.put(cartToken, JSON.stringify(newCart)))

  const newHeaders = new Headers(addResponse.headers)
  newHeaders.append('Set-Cookie', `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`)

  return createResponse(newCart, newHeaders, 200)
}

export async function clearCart({ request, event }: RouteProps): Promise<Response> {
  const host = (new URL(request.url)).hostname
  const cookie = parse(request.headers.get('Cookie') || '');
  const cartToken = cookie[COOKIE_NAME] ?? uuid()

  event.waitUntil(CART_STORE.delete(cartToken))

  return fetch(`https://${host}/cart/clear.js`, {
    headers: {
      ...buildHeaders(request),
    }
  }).then(() => loadCart('no-cart').then(cart => createResponse(cart, {
    'Set-Cookie': `${COOKIE_NAME}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}`,
  }, 200)))
}
