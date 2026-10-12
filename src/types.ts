export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessageDirection = 'incoming' | 'outgoing'

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  /** idMessage from GREEN-API, or a local id while the message is being sent */
  id: string
  text: string
  direction: MessageDirection
  /** Unix time in milliseconds */
  timestamp: number
  status?: MessageStatus
}

export interface Chat {
  /** chatId used for sending, e.g. "79991234567@c.us" */
  id: string
  title: string
  /** Other chatIds GREEN-API reported for the same contact */
  aliases: string[]
  messages: Message[]
  unread: number
}
