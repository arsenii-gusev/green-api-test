import { useEffect, useRef, useState } from 'react'
import { deleteNotification, describeError, receiveNotification } from '../api/greenApi'
import { parseNotification, type ChatEvent } from '../lib/notifications'
import type { Credentials } from '../types'

const RECEIVE_TIMEOUT_SECONDS = 5
const RETRY_DELAY_MS = 3000

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Receives incoming notifications with the HTTP API technology:
 * ReceiveNotification long-polls the queue, DeleteNotification removes each handled one.
 * Returns the last connection error, or null while polling works.
 */
export function useNotificationPolling(credentials: Credentials, onEvent: (event: ChatEvent) => void) {
  const [error, setError] = useState<string | null>(null)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function poll() {
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(credentials, RECEIVE_TIMEOUT_SECONDS, signal)
          if (notification) {
            const event = parseNotification(notification.body)
            if (event) onEventRef.current(event)
            await deleteNotification(credentials, notification.receiptId, signal)
          }
          setError(null)
        } catch (err) {
          if (signal.aborted) return
          setError(describeError(err))
          await wait(RETRY_DELAY_MS, signal)
        }
      }
    }

    void poll()
    return () => controller.abort()
  }, [credentials])

  return error
}
