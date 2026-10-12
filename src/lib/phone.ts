/** Returns phone digits in international format, or null if the input is not a phone number */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  // Russian local format: 8XXXXXXXXXX -> 7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length < 10 || digits.length > 15) return null
  return digits
}

export function phoneToChatId(phone: string): string {
  return `${phone}@c.us`
}

/** The part of a chatId that identifies the contact, without the "@c.us" suffix */
export function chatIdKey(chatId: string): string {
  return chatId.split('@')[0]
}

export function isPersonalChat(chatId: string): boolean {
  return !chatId.endsWith('@g.us') && !chatId.startsWith('-')
}

export function chatTitleFromId(chatId: string): string {
  const key = chatIdKey(chatId)
  return /^\d{10,15}$/.test(key) ? `+${key}` : key
}
