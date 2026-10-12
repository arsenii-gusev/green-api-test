import { describe, expect, it } from 'vitest'
import { chatTitleFromId, normalizePhone, phoneToChatId } from './phone'

describe('normalizePhone', () => {
  it('keeps international digits', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
  })

  it('converts Russian 8-prefixed numbers', () => {
    expect(normalizePhone('8 999 123 45 67')).toBe('79991234567')
  })

  it('rejects too short input', () => {
    expect(normalizePhone('12345')).toBeNull()
  })
})

describe('chat ids', () => {
  it('builds a personal chatId from a phone', () => {
    expect(phoneToChatId('79991234567')).toBe('79991234567@c.us')
  })

  it('shows phone chats as +number', () => {
    expect(chatTitleFromId('79991234567@c.us')).toBe('+79991234567')
  })
})
