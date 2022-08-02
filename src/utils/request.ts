import config from '../../cart.config'
import { parse } from './cookie'
import { decrypt } from './encrypt'

export default async function useRequest(
  request: Request,
): Promise<{ host: string; cartToken: string }> {
  const cookie = parse(request.headers.get('Cookie') || '')
  const cartToken = (await decrypt(cookie[config.cookie.name])) ?? config.cookie.generator()
  const host = new URL(request.url).hostname

  return {
    host,
    cartToken,
  }
}
