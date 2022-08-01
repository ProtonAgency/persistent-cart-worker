import config from '../../cart.config'

export default function createResponse(body: unknown, headers = {}, code = 200): Response {
  const defaultHeaders = new Headers(headers)
  defaultHeaders.set('Content-Type', 'application/json')
  if (config.cors.enabled) {
    defaultHeaders.set('Access-Control-Allow-Origin', config.cors.domain)
    defaultHeaders.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    defaultHeaders.set('Access-Control-Max-Age', '86400')
    defaultHeaders.set('Access-Control-Allow-Headers', '*')
  }

  return new Response(JSON.stringify(body), {
    status: code,
    headers: defaultHeaders,
  })
}
