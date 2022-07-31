export default function buildHeaders(
  request: Request | Response,
  overrideCookieHeader: string | null = null,
): { [key: string]: string } {
  return {
    Accept: String(request.headers.get('accept')),
    'Accept-Encoding': String(request.headers.get('accept-encoding')),
    'Accept-Language': String(request.headers.get('accept-language')),
    'Cache-Control': 'no-cache',
    Cookie: overrideCookieHeader || String(request.headers.get('Cookie')),
    Host: String(request.headers.get('host')),
    Origin: String(request.headers.get('origin')),
    Referer: String(request.headers.get('Referer')),
    'User-Agent': String(request.headers.get('user-agent')),
  }
}
