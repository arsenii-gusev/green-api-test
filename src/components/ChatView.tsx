import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { chatTitleFromId } from '../lib/phone'
import { dayKey, formatDayLabel, formatTime } from '../lib/time'
import type { Chat, Message } from '../types'
import { Avatar } from './Avatar'
import { BackIcon, CheckIcon, SendIcon } from './Icons'

const MAX_MESSAGE_LENGTH = 4000

function MessageStatusMark({ message }: { message: Message }) {
  switch (message.status) {
    case 'pending':
      return <span className="message__status" title="Отправляется">🕓</span>
    case 'failed':
      return <span className="message__status message__status--failed" title="Не отправлено">!</span>
    case 'sent':
      return <CheckIcon className="message__status" aria-label="Отправлено" />
    case 'delivered':
      return <CheckIcon className="message__status" double aria-label="Доставлено" />
    case 'read':
      return <CheckIcon className="message__status message__status--read" double aria-label="Прочитано" />
    default:
      return null
  }
}

interface ChatViewProps {
  chat: Chat
  onSend: (text: string) => void
  onBack: () => void
}

export function ChatView({ chat, onSend, onBack }: ChatViewProps) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const subtitle = chatTitleFromId(chat.id)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [chat.messages.length])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="icon-button chat__back" type="button" onClick={onBack} aria-label="Назад к чатам">
          <BackIcon />
        </button>
        <Avatar seed={chat.id} title={chat.title} size={40} />
        <div className="chat__heading">
          <h2 className="chat__title">{chat.title}</h2>
          {subtitle !== chat.title && <span className="chat__subtitle">{subtitle}</span>}
        </div>
      </header>

      <div className="chat__messages" ref={listRef}>
        {chat.messages.length === 0 && (
          <p className="chat__placeholder">Здесь пока пусто. Напишите первое сообщение.</p>
        )}
        {chat.messages.map((message, index) => {
          const previous = chat.messages[index - 1]
          const newDay = !previous || dayKey(previous.timestamp) !== dayKey(message.timestamp)
          return (
            <Fragment key={message.id}>
              {newDay && <div className="chat__day">{formatDayLabel(message.timestamp)}</div>}
              <div className={`message message--${message.direction}`}>
                <span className="message__text">{message.text}</span>
                <span className="message__meta">
                  {formatTime(message.timestamp)}
                  {message.direction === 'outgoing' && <MessageStatusMark message={message} />}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="composer__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          aria-label="Текст сообщения"
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
        />
        <button
          className="icon-button icon-button--accent composer__send"
          type="submit"
          disabled={!draft.trim()}
          aria-label="Отправить"
        >
          <SendIcon />
        </button>
      </form>
    </section>
  )
}
