import type { NotificationBody } from '../api/greenApi'
import type { Message, MessageStatus } from '../types'
import { isPersonalChat } from './phone'

export type ChatEvent =
  | { type: 'message'; chatId: string; senderName?: string; message: Message }
  | { type: 'status'; idMessage: string; status: MessageStatus }

const STATUS_MAP: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
  yellowCard: 'failed',
}

function extractText(body: NotificationBody): string | null {
  const data = body.messageData
  if (!data) return null
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null
  return null
}

/** Turns a GREEN-API notification into a chat event; returns null for anything the chat ignores */
export function parseNotification(body: NotificationBody): ChatEvent | null {
  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived':
    case 'outgoingAPIMessageReceived': {
      const chatId = body.senderData?.chatId
      const text = extractText(body)
      if (!chatId || !isPersonalChat(chatId) || text === null || !body.idMessage) return null
      const incoming = body.typeWebhook === 'incomingMessageReceived'
      return {
        type: 'message',
        chatId,
        senderName: incoming ? body.senderData?.senderName || body.senderData?.chatName : undefined,
        message: {
          id: body.idMessage,
          text,
          direction: incoming ? 'incoming' : 'outgoing',
          timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
          status: incoming ? undefined : 'sent',
        },
      }
    }
    case 'outgoingMessageStatus': {
      const status = body.status && STATUS_MAP[body.status]
      if (!body.idMessage || !status) return null
      return { type: 'status', idMessage: body.idMessage, status }
    }
    default:
      return null
  }
}
