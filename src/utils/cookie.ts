import { parse } from 'cookie'
import config from '../../cart.config'
import { encrypt } from './encrypt'

const generateCookieValue = async (cartToken: string): Promise<string> =>
  encrypt(cartToken).then(
    (token) =>
      `${config.cookie.name}=${token}; path=/; secure; HttpOnly; SameSite=Strict; Max-Age=${config.cookie.expiration}`,
  )

export { parse, generateCookieValue }
