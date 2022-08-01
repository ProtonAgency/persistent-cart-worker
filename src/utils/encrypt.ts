import config from '../../cart.config'

export async function encrypt(value: string): Promise<string> {
  if (config.cookie.encryptionKey) {
    const digest = await crypto.subtle.encrypt(
      'AES-CTR',
      config.cookie.encryptionKey,
      new TextEncoder().encode(value),
    )
    return new TextDecoder().decode(digest)
  }

  return value
}

export async function decrypt(value: string): Promise<string> {
  if (config.cookie.encryptionKey) {
    const digest = await crypto.subtle.decrypt(
      'AES-CTR',
      config.cookie.encryptionKey,
      new TextEncoder().encode(value),
    )
    return new TextDecoder().decode(digest)
  }

  return value
}
