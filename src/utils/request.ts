import config from '../../cart.config'
import { parse } from './cookie'

export default function useRequest(request: Request): { host: string; cartToken: string } {
  const cookie = parse(request.headers.get('Cookie') || '')
  const cartToken = cookie[config.cookie.name] ?? config.cookie.generator()
  const host = new URL(request.url).hostname

  return {
    host,
    cartToken,
  }
}
