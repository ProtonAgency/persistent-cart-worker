import { parse } from 'cookie'
import config from '../../cart.config'

const generateCookieValue = (cartToken: string): string =>
  `${config.cookie.name}=${cartToken}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${config.cookie.expiration}`

export { parse, generateCookieValue }
