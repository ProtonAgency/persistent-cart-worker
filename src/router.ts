import { Router, Method } from 'tiny-request-router'

export async function route(event: FetchEvent, request: Request): Promise<Response> {
  const router = new Router()
  const url = new URL(request.url)

  // todo: cart endpoints

  const match = router.match(<Method>request.method, url.pathname)
  if (match) {
    return match.handler({params: match.params, request, event})
  } else {
    return fetch(request)
  }
}

export interface RouteProps {
  params: Params
  request: Request,
  event: FetchEvent
}
