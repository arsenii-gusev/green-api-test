import type { Credentials } from '../types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

/** Notification body as returned by ReceiveNotification (only the fields the chat uses) */
export interface NotificationBody {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  status?: string
  chatId?: string
  senderData?: {
    chatId: string
    sender?: string
    senderName?: string
    chatName?: string
  }
  messageData?: {
    typeMessage: string
    textMessageData?: { textMessage: string }
    extendedTextMessageData?: { text: string }
  }
}

export interface Notification {
  receiptId: number
  body: NotificationBody
}

export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'sleepMode'
  | 'starting'
  | 'yellowCard'

function methodUrl(credentials: Credentials, method: string, suffix = ''): string {
  const base = credentials.apiUrl.trim().replace(/\/+$/, '')
  return `${base}/waInstance${credentials.idInstance.trim()}/${method}/${credentials.apiTokenInstance.trim()}${suffix}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new GreenApiError(response.status, details || response.statusText)
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

export async function getStateInstance(credentials: Credentials, signal?: AbortSignal) {
  const data = await request<{ stateInstance: InstanceState }>(
    methodUrl(credentials, 'getStateInstance'),
    { signal },
  )
  return data.stateInstance
}

export async function sendMessage(credentials: Credentials, chatId: string, message: string) {
  const data = await request<{ idMessage: string }>(methodUrl(credentials, 'sendMessage'), {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  })
  return data.idMessage
}

/**
 * Long-polls the instance queue. Resolves with null when the queue stayed empty
 * for `receiveTimeout` seconds.
 */
export function receiveNotification(
  credentials: Credentials,
  receiveTimeout: number,
  signal?: AbortSignal,
) {
  return request<Notification | null>(
    methodUrl(credentials, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`),
    { signal },
  )
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
  signal?: AbortSignal,
) {
  await request<{ result: boolean }>(methodUrl(credentials, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
    signal,
  })
}

export function describeError(error: unknown): string {
  if (error instanceof GreenApiError) {
    if (error.status === 401 || error.status === 403) return 'Неверный idInstance или apiTokenInstance'
    if (error.status === 404) return 'Инстанс не найден, проверьте apiUrl и idInstance'
    if (error.status === 429) return 'Слишком много запросов, попробуйте позже'
    return `Ошибка GREEN-API (${error.status})`
  }
  if (error instanceof TypeError) return 'Нет связи с GREEN-API, проверьте apiUrl и интернет'
  return 'Что-то пошло не так'
}
