export default function createResponse(body: any, json = true, code = 200): Response {
  return new Response(json ? JSON.stringify(body) : body, {
    status: code,
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,POST,DELETE,OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Headers': '*',
    },
  })
}
