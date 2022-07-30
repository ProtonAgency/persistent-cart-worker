import { RouteProps } from "../router";
import createResponse from "../utils/response";

interface NoteAttribute {
  name: string
  value: string
}
interface Order {
  note_attributes: NoteAttribute[]
}

export async function deleteCart({ request }: RouteProps): Promise<Response> {
  const payload: Order = await request.json()
  const note: NoteAttribute|undefined = payload.note_attributes.find((attr: NoteAttribute) => attr.name === 'x-cart-id')
  if (note) {
    await CART_STORE.delete(note.value)
  }

  return createResponse(null)
}
