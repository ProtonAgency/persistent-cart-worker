import { uuid } from '@cfworker/uuid'

export default {
  cookie: {
    // first-party cookie name
    name: '__ctoken',
    // first part cookie expiration ttl (one year by default)
    expiration: 31_536_000,
    // method used for generating cookie value, not recommended to change this
    generator: uuid,
  },
  cors: {
    // enable cross-origin-resource-sharing
    enabled: true,
    // domain allowed for cross-origin-resource-sharing
    domain: '*',
  }
}
