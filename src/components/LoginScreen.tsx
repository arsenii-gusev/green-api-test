import { useState, type FormEvent } from 'react'
import { describeError, getStateInstance } from '../api/greenApi'
import type { Credentials } from '../types'
import { Logo } from './Icons'

const DEFAULT_API_URL = 'https://api.green-api.com'

const STATE_HINTS: Record<string, string> = {
  notAuthorized: 'Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API.',
  blocked: 'Аккаунт заблокирован.',
  sleepMode: 'Инстанс в спящем режиме. Откройте мессенджер на телефоне.',
  starting: 'Инстанс запускается, попробуйте через минуту.',
  yellowCard: 'Отправка сообщений частично или полностью приостановлена.',
}

interface LoginScreenProps {
  onLogin: (credentials: Credentials) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const credentials = {
      apiUrl: apiUrl.trim() || DEFAULT_API_URL,
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    setError(null)
    setLoading(true)
    try {
      const state = await getStateInstance(credentials)
      if (state === 'authorized') onLogin(credentials)
      else setError(STATE_HINTS[state] ?? `Инстанс недоступен (${state})`)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <Logo />
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__subtitle">
          Введите данные инстанса из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
        </p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            inputMode="numeric"
            autoComplete="username"
            placeholder="1101000001"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">apiUrl</span>
          <input
            className="field__input"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            type="url"
            placeholder={DEFAULT_API_URL}
          />
        </label>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button className="button button--primary" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
