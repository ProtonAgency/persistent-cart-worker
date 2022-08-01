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
