import { useState, type FormEvent } from 'react'
import { lastActivity } from '../lib/chats'
import { normalizePhone } from '../lib/phone'
import { formatChatTime } from '../lib/time'
import type { Chat } from '../types'
import { Avatar } from './Avatar'
import { LogoutIcon, PlusIcon } from './Icons'

interface SidebarProps {
  chats: Chat[]
  activeChatId: string | null
  idInstance: string
  onOpenChat: (phone: string) => void
  onSelectChat: (chatId: string) => void
  onLogout: () => void
}

export function Sidebar({ chats, activeChatId, idInstance, onOpenChat, onSelectChat, onLogout }: SidebarProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sorted = [...chats].sort((a, b) => lastActivity(b) - lastActivity(a))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizePhone(phone)
    if (!normalized) {
      setError('Введите номер в международном формате, например 79991234567')
      return
    }
    setError(null)
    setPhone('')
    onOpenChat(normalized)
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div>
          <h1 className="sidebar__title">Чаты</h1>
          <span className="sidebar__instance">Инстанс {idInstance}</span>
        </div>
        <button className="icon-button" type="button" onClick={onLogout} title="Выйти" aria-label="Выйти">
          <LogoutIcon />
        </button>
      </header>

      <form className="new-chat" onSubmit={handleSubmit}>
        <input
          className="new-chat__input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          inputMode="tel"
          placeholder="Номер получателя"
          aria-label="Номер телефона получателя"
          aria-invalid={error ? true : undefined}
        />
        <button className="icon-button icon-button--accent" type="submit" title="Создать чат" aria-label="Создать чат">
          <PlusIcon />
        </button>
      </form>
      {error && (
        <p className="new-chat__error" role="alert">
          {error}
        </p>
      )}

      <ul className="chat-list">
        {sorted.length === 0 && (
          <li className="chat-list__empty">Введите номер телефона, чтобы начать новый чат</li>
        )}
        {sorted.map((chat) => {
          const last = chat.messages.at(-1)
          return (
            <li key={chat.id}>
              <button
                type="button"
                className={`chat-item${chat.id === activeChatId ? ' chat-item--active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <Avatar seed={chat.id} title={chat.title} />
                <span className="chat-item__body">
                  <span className="chat-item__row">
                    <span className="chat-item__title">{chat.title}</span>
                    {last && <span className="chat-item__time">{formatChatTime(last.timestamp)}</span>}
                  </span>
                  <span className="chat-item__row">
                    <span className="chat-item__preview">
                      {last ? `${last.direction === 'outgoing' ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="chat-item__badge">{chat.unread}</span>}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
