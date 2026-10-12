import type { Credentials } from '../types'
import type { ChatsState } from './chats'

const CREDENTIALS_KEY = 'green-api-chat:credentials'
const chatsKey = (idInstance: string) => `green-api-chat:chats:${idInstance}`

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode, quota); the chat still works in memory
  }
}

export const loadCredentials = () => read<Credentials>(CREDENTIALS_KEY)
export const saveCredentials = (credentials: Credentials | null) => write(CREDENTIALS_KEY, credentials)

export function loadChats(idInstance: string): ChatsState {
  const chats = read<ChatsState['chats']>(chatsKey(idInstance)) ?? []
  return {
    // A message still pending when the page was closed never got a response
    chats: chats.map((chat) => ({
      ...chat,
      messages: chat.messages.map((m) => (m.status === 'pending' ? { ...m, status: 'failed' } : m)),
    })),
    activeChatId: null,
  }
}

export const saveChats = (idInstance: string, chats: ChatsState['chats']) =>
  write(chatsKey(idInstance), chats)
