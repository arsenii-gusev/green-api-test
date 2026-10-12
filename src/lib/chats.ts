import type { Chat, Message, MessageStatus } from '../types'
import type { ChatEvent } from './notifications'
import { chatIdKey, chatTitleFromId } from './phone'

export interface ChatsState {
  chats: Chat[]
  activeChatId: string | null
}

export type ChatsAction =
  | { type: 'open'; chatId: string }
  | { type: 'select'; chatId: string | null }
  | { type: 'messageQueued'; chatId: string; message: Message }
  | { type: 'messageSent'; chatId: string; localId: string; idMessage: string }
  | { type: 'messageFailed'; chatId: string; localId: string }
  | { type: 'event'; event: ChatEvent }

export const initialChatsState: ChatsState = { chats: [], activeChatId: null }

const STATUS_RANK: Record<MessageStatus, number> = {
  failed: -1,
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

/** Finds the chat a chatId belongs to: by id, by a known alias, or by the same phone number */
export function findChat(chats: Chat[], chatId: string): Chat | undefined {
  const key = chatIdKey(chatId)
  return (
    chats.find((chat) => chat.id === chatId || chat.aliases.includes(chatId)) ??
    chats.find((chat) => chatIdKey(chat.id) === key)
  )
}

export function lastActivity(chat: Chat): number {
  return chat.messages.at(-1)?.timestamp ?? 0
}

function updateChat(state: ChatsState, chatId: string, update: (chat: Chat) => Chat): ChatsState {
  return {
    ...state,
    chats: state.chats.map((chat) => (chat.id === chatId ? update(chat) : chat)),
  }
}

function createChat(chatId: string, title?: string): Chat {
  return { id: chatId, title: title || chatTitleFromId(chatId), aliases: [], messages: [], unread: 0 }
}

function applyMessage(state: ChatsState, event: Extract<ChatEvent, { type: 'message' }>): ChatsState {
  const { chatId, message, senderName } = event

  // A message we already know (e.g. the echo of our own sendMessage) tells us which chat
  // the reported chatId belongs to, even when GREEN-API uses an id other than the phone number.
  const owner =
    state.chats.find((chat) => chat.messages.some((m) => m.id === message.id)) ??
    findChat(state.chats, chatId)

  if (!owner) {
    const chat = { ...createChat(chatId, senderName), messages: [message], unread: 1 }
    return { ...state, chats: [chat, ...state.chats] }
  }

  return updateChat(state, owner.id, (chat) => {
    const aliases =
      chatId === chat.id || chat.aliases.includes(chatId) ? chat.aliases : [...chat.aliases, chatId]
    const title = chat.title === chatTitleFromId(chat.id) && senderName ? senderName : chat.title

    if (chat.messages.some((m) => m.id === message.id)) return { ...chat, aliases, title }

    // The echo of a message we sent can arrive before the sendMessage response
    const pendingIndex =
      message.direction === 'outgoing'
        ? chat.messages.findIndex((m) => m.status === 'pending' && m.text === message.text)
        : -1
    const messages =
      pendingIndex >= 0
        ? chat.messages.map((m, i) => (i === pendingIndex ? { ...m, id: message.id, status: 'sent' as const } : m))
        : [...chat.messages, message].sort((a, b) => a.timestamp - b.timestamp)

    const isActive = state.activeChatId === chat.id
    const unread = message.direction === 'incoming' && !isActive ? chat.unread + 1 : chat.unread
    return { ...chat, aliases, title, messages, unread }
  })
}

function applyStatus(state: ChatsState, idMessage: string, status: MessageStatus): ChatsState {
  return {
    ...state,
    chats: state.chats.map((chat) => {
      if (!chat.messages.some((m) => m.id === idMessage)) return chat
      return {
        ...chat,
        messages: chat.messages.map((m) => {
          if (m.id !== idMessage) return m
          const current = m.status ?? 'pending'
          if (status !== 'failed' && STATUS_RANK[status] <= STATUS_RANK[current]) return m
          return { ...m, status }
        }),
      }
    }),
  }
}

export function chatsReducer(state: ChatsState, action: ChatsAction): ChatsState {
  switch (action.type) {
    case 'open': {
      const existing = findChat(state.chats, action.chatId)
      if (existing) return chatsReducer(state, { type: 'select', chatId: existing.id })
      return { chats: [createChat(action.chatId), ...state.chats], activeChatId: action.chatId }
    }
    case 'select': {
      if (action.chatId === null) return { ...state, activeChatId: null }
      return updateChat({ ...state, activeChatId: action.chatId }, action.chatId, (chat) => ({
        ...chat,
        unread: 0,
      }))
    }
    case 'messageQueued':
      return updateChat(state, action.chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, action.message],
      }))
    case 'messageSent':
      return updateChat(state, action.chatId, (chat) => {
        // The echo notification may already have added this message under its real id
        if (chat.messages.some((m) => m.id === action.idMessage)) {
          return { ...chat, messages: chat.messages.filter((m) => m.id !== action.localId) }
        }
        return {
          ...chat,
          messages: chat.messages.map((m) =>
            m.id === action.localId ? { ...m, id: action.idMessage, status: 'sent' } : m,
          ),
        }
      })
    case 'messageFailed':
      return updateChat(state, action.chatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) => (m.id === action.localId ? { ...m, status: 'failed' } : m)),
      }))
    case 'event':
      return action.event.type === 'message'
        ? applyMessage(state, action.event)
        : applyStatus(state, action.event.idMessage, action.event.status)
  }
}
