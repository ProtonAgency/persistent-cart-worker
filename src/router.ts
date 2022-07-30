import { Router, Method } from 'tiny-request-router'
import { addItem, clearCart, fetchCart, updateCart, updateItem } from './routes/cart'
import { deleteCart } from './routes/webhooks'

export async function route(event: FetchEvent, request: Request): Promise<Response> {
  const router = new Router()
  const url = new URL(request.url)

  router.get('/cart.js', fetchCart)
  router.get('/cart/clear.js', clearCart)
  router.post('/cart/add.js', addItem)
  router.post('/cart/change.js', updateItem)
  router.post('/cart/update.js', updateCart)

  router.post('/cdn-cgi/shopify/webhook', deleteCart)

  const match = router.match(<Method>request.method, url.pathname)
  if (match) {
    return match.handler({params: match.params, request, event})
  } else {
    // return origin if we do not have a matching route
    return fetch(request)
  }
}

export interface RouteProps {
  params: Params
  request: Request,
  event: FetchEvent
}
