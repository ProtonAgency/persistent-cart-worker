# persistent-cart-worker

A Cloudflare Worker that runs over a Shopify store utilizing Cloudflare O2O to persist a customers cart contents longer than the random Shopify expiration (7-14 days).

## Features

- Persits cart for a configured timeframe (default one year).
- Encrypted cookies.
- Loads old carts from origin.
- Works with line item scripts.
- Requires no frontend changes to integrate.
- Works with all Shopify Apps.
- Requires no data integrations with Shopify.

## How does it work?

This works by proxying the `/cart*.js` routes and the `/cart` route. When a call is made to `/cart/add.js`, `/cart/update.js` or `/cart/change.js` the shopify cart is cleared, then the cached cart contents are added back with the new request data. If the add fails we return the error from Shopify, if it is successful we cache the cart and update the `cart` cookie in the browser.

When you navigate to the `/cart` route we again clear the Shopify cart and add all items/attributes back before updating the `cart` cookie. This allows us to avoid validating inventory, deleted products, etc and allows line item scripts to properly run.

## Configuration

Configuration can be found in `cart.config.ts`

```ts
import { uuid } from '@cfworker/uuid'

export default {
  /** First Part Cookie Settings */
  cookie: {
    // first-party cookie name
    name: '__ctoken',
    // first part cookie expiration ttl (one year by default)
    expiration: 31_536_000,
    // method used for generating cookie value, not recommended to change this
    generator: uuid,
    /**
     * encryption key for the cookie value, if null encryption is disabled. 
     * NOTE: This must be a string derived from the `CryptoKey` interface.
     * NOTE: Additionally, if used this value must be set prior to production deployment or it will break existing carts
     */
    encryptionKey: null,
  },
  /** Cross-Origin-Resource-Sharing */
  cors: {
    // enable cross-origin-resource-sharing
    enabled: true,
    // domain allowed for cross-origin-resource-sharing
    domain: '*',
  },
  /** Origin (Shopify) Cart Settings */
  cart: {
    loading: {
      // if set to true the cart will be reloaded in the background (use if deploying over an existing shopify store to sync existing customer carts)
      background: true,
    },
  },
}

```
