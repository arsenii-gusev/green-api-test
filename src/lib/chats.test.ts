import { describe, expect, it } from 'vitest'
import type { Message } from '../types'
import { chatsReducer, initialChatsState, type ChatsState } from './chats'

const CHAT = '79991234567@c.us'

function incoming(id: string, text: string, chatId = CHAT, timestamp = 1000) {
  return {
    type: 'event' as const,
    event: {
      type: 'message' as const,
      chatId,
      message: { id, text, direction: 'incoming' as const, timestamp } satisfies Message,
    },
  }
}

function withQueuedMessage(): ChatsState {
  const opened = chatsReducer(initialChatsState, { type: 'open', chatId: CHAT })
  return chatsReducer(opened, {
    type: 'messageQueued',
    chatId: CHAT,
    message: { id: 'local-1', text: 'Привет', direction: 'outgoing', timestamp: 500, status: 'pending' },
  })
}

describe('chatsReducer', () => {
  it('opens a chat once and selects it', () => {
    const once = chatsReducer(initialChatsState, { type: 'open', chatId: CHAT })
    const twice = chatsReducer(once, { type: 'open', chatId: CHAT })
    expect(twice.chats).toHaveLength(1)
    expect(twice.activeChatId).toBe(CHAT)
  })

  it('replaces the local id after sendMessage succeeds', () => {
    const state = chatsReducer(withQueuedMessage(), {
      type: 'messageSent',
      chatId: CHAT,
      localId: 'local-1',
      idMessage: 'OUT1',
    })
    expect(state.chats[0].messages).toEqual([expect.objectContaining({ id: 'OUT1', status: 'sent' })])
  })

  it('does not duplicate a message whose echo arrives before the send response', () => {
    let state = chatsReducer(withQueuedMessage(), {
      type: 'event',
      event: {
        type: 'message',
        chatId: CHAT,
        message: { id: 'OUT1', text: 'Привет', direction: 'outgoing', timestamp: 600, status: 'sent' },
      },
    })
    state = chatsReducer(state, { type: 'messageSent', chatId: CHAT, localId: 'local-1', idMessage: 'OUT1' })
    expect(state.chats[0].messages.map((m) => m.id)).toEqual(['OUT1'])
  })

  it('adds replies to the open chat without counting them unread', () => {
    const state = chatsReducer(withQueuedMessage(), incoming('IN1', 'Ответ'))
    expect(state.chats[0].messages.map((m) => m.text)).toEqual(['Привет', 'Ответ'])
    expect(state.chats[0].unread).toBe(0)
  })

  it('creates a chat for an unknown sender and counts it unread', () => {
    const state = chatsReducer(initialChatsState, incoming('IN1', 'Привет', '79990000000@c.us'))
    expect(state.chats[0]).toMatchObject({ id: '79990000000@c.us', unread: 1 })
  })

  it('ignores a notification it already handled', () => {
    const once = chatsReducer(initialChatsState, incoming('IN1', 'Привет'))
    const twice = chatsReducer(once, incoming('IN1', 'Привет'))
    expect(twice.chats[0].messages).toHaveLength(1)
  })

  it('learns another chatId for a contact from the echo of a sent message', () => {
    let state = chatsReducer(withQueuedMessage(), {
      type: 'messageSent',
      chatId: CHAT,
      localId: 'local-1',
      idMessage: 'OUT1',
    })
    state = chatsReducer(state, {
      type: 'event',
      event: {
        type: 'message',
        chatId: '123456789',
        message: { id: 'OUT1', text: 'Привет', direction: 'outgoing', timestamp: 600, status: 'sent' },
      },
    })
    state = chatsReducer(state, incoming('IN1', 'Ответ', '123456789'))
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0].messages.map((m) => m.text)).toEqual(['Привет', 'Ответ'])
  })

  it('never downgrades a read status', () => {
    let state = chatsReducer(withQueuedMessage(), {
      type: 'messageSent',
      chatId: CHAT,
      localId: 'local-1',
      idMessage: 'OUT1',
    })
    state = chatsReducer(state, { type: 'event', event: { type: 'status', idMessage: 'OUT1', status: 'read' } })
    state = chatsReducer(state, { type: 'event', event: { type: 'status', idMessage: 'OUT1', status: 'delivered' } })
    expect(state.chats[0].messages[0].status).toBe('read')
  })
})
