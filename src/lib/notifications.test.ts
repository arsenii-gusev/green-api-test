import { describe, expect, it } from 'vitest'
import { parseNotification } from './notifications'

const incoming = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1700000000,
  idMessage: 'IN1',
  senderData: { chatId: '79991234567@c.us', sender: '79991234567@c.us', senderName: 'Иван' },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
}

describe('parseNotification', () => {
  it('parses an incoming text message', () => {
    expect(parseNotification(incoming)).toEqual({
      type: 'message',
      chatId: '79991234567@c.us',
      senderName: 'Иван',
      message: { id: 'IN1', text: 'Привет', direction: 'incoming', timestamp: 1700000000000, status: undefined },
    })
  })

  it('parses extended text messages', () => {
    const event = parseNotification({
      ...incoming,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'https://max.ru' } },
    })
    expect(event?.type === 'message' && event.message.text).toBe('https://max.ru')
  })

  it('marks messages sent from the phone as outgoing', () => {
    const event = parseNotification({ ...incoming, typeWebhook: 'outgoingMessageReceived' })
    expect(event?.type === 'message' && event.message.direction).toBe('outgoing')
  })

  it('ignores non-text messages and group chats', () => {
    expect(parseNotification({ ...incoming, messageData: { typeMessage: 'imageMessage' } })).toBeNull()
    expect(
      parseNotification({ ...incoming, senderData: { ...incoming.senderData, chatId: '1203630@g.us' } }),
    ).toBeNull()
  })

  it('maps delivery statuses', () => {
    expect(parseNotification({ typeWebhook: 'outgoingMessageStatus', idMessage: 'OUT1', status: 'read' })).toEqual({
      type: 'status',
      idMessage: 'OUT1',
      status: 'read',
    })
  })

  it('ignores other notification types', () => {
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toBeNull()
  })
})
