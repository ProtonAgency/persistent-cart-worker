import buildHeaders from './build-headers'

export async function generateCart(
  request: Request,
  cart: Cart,
  cartToken: string,
  additionalItems: {
    id: number
    quantity: number
    properties: { [key: string]: string } | null | undefined
  }[] = [],
): Promise<{ cart: Cart; headers: Headers; message: string | undefined }> {
  const host = new URL(request.url).hostname
  await fetch(`https://${host}/cart/clear.js`, {
    headers: {
      ...buildHeaders(request),
    },
  })

  await fetch(`https://${host}/cart.js`, {
    headers: {
      ...buildHeaders(request),
    },
  })

  const addResponse = await fetch(`https://${host}/cart/add.js`, {
    method: 'POST',
    body: JSON.stringify({
      items: cart.items
        .map(
          (
            it,
          ): {
            id: number
            quantity: number
            properties: { [key: string]: string } | null | undefined
          } => {
            return {
              id: it.id,
              quantity: it.quantity,
              properties: it.properties || undefined,
            }
          },
        )
        .concat(additionalItems),
    }),
    headers: {
      ...buildHeaders(request, 'no-cookie'),
      'content-type': 'application/json',
    },
  })

  if (!addResponse.ok) {
    throw new Error(await addResponse.text())
  }

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
    },
  })

  const json: Cart = await addTokenResponse.json()
  const newCart = {
    ...json,
    token: cart.token,
    items: json.items.sort((a: CartItem, b: CartItem) => (a.key > b.key ? 1 : -1)),
  }

  return {
    cart: newCart,
    headers: addResponse.headers,
    message: undefined,
  }
}
