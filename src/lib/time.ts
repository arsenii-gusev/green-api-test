const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const shortDateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const longDateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatTime(timestamp: number) {
  return timeFormat.format(timestamp)
}

/** Time for today's messages, a short date for older ones */
export function formatChatTime(timestamp: number, now = new Date()) {
  return isSameDay(new Date(timestamp), now) ? timeFormat.format(timestamp) : shortDateFormat.format(timestamp)
}

export function formatDayLabel(timestamp: number, now = new Date()) {
  const date = new Date(timestamp)
  if (isSameDay(date, now)) return 'Сегодня'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'Вчера'
  return longDateFormat.format(date)
}

export function dayKey(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}
