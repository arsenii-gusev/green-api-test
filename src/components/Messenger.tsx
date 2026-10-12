import { useCallback, useEffect, useReducer } from 'react'
import { describeError, sendMessage } from '../api/greenApi'
import { useNotificationPolling } from '../hooks/useNotificationPolling'
import { chatsReducer } from '../lib/chats'
import type { ChatEvent } from '../lib/notifications'
import { phoneToChatId } from '../lib/phone'
import { loadChats, saveChats } from '../lib/storage'
import type { Credentials } from '../types'
import { ChatView } from './ChatView'
import { Sidebar } from './Sidebar'

interface MessengerProps {
  credentials: Credentials
  onLogout: () => void
}

export function Messenger({ credentials, onLogout }: MessengerProps) {
  const [state, dispatch] = useReducer(chatsReducer, credentials.idInstance, loadChats)
  const activeChat = state.chats.find((chat) => chat.id === state.activeChatId) ?? null

  useEffect(() => {
    saveChats(credentials.idInstance, state.chats)
  }, [credentials.idInstance, state.chats])

  const handleEvent = useCallback((event: ChatEvent) => dispatch({ type: 'event', event }), [])
  const connectionError = useNotificationPolling(credentials, handleEvent)

  async function handleSend(text: string) {
    if (!activeChat) return
    const chatId = activeChat.id
    const localId = `local-${crypto.randomUUID()}`
    dispatch({
      type: 'messageQueued',
      chatId,
      message: { id: localId, text, direction: 'outgoing', timestamp: Date.now(), status: 'pending' },
    })
    try {
      const idMessage = await sendMessage(credentials, chatId, text)
      dispatch({ type: 'messageSent', chatId, localId, idMessage })
    } catch (err) {
      console.error('sendMessage failed:', describeError(err), err)
      dispatch({ type: 'messageFailed', chatId, localId })
    }
  }

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`}>
      <Sidebar
        chats={state.chats}
        activeChatId={state.activeChatId}
        idInstance={credentials.idInstance}
        onOpenChat={(phone) => dispatch({ type: 'open', chatId: phoneToChatId(phone) })}
        onSelectChat={(chatId) => dispatch({ type: 'select', chatId })}
        onLogout={onLogout}
      />
      <main className="messenger__main">
        {connectionError && (
          <div className="banner" role="status">
            {connectionError}. Переподключаемся…
          </div>
        )}
        {activeChat ? (
          <ChatView key={activeChat.id} chat={activeChat} onSend={handleSend} onBack={() => dispatch({ type: 'select', chatId: null })} />
        ) : (
          <div className="messenger__empty">Выберите чат или создайте новый по номеру телефона</div>
        )}
      </main>
    </div>
  )
}
