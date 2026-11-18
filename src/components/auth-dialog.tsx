'use client'

import type { AppUserView } from '@/lib/app-auth'
import { type FormEvent, useEffect, useState } from 'react'
import { Icon } from './edu-icons'

type Feedback = { text: string; ok: boolean } | null

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

export function AuthDialog({
  open = true,
  onClose,
  onAuthenticated,
}: {
  open?: boolean
  onClose: () => void
  onAuthenticated: (user: AppUserView) => void
}) {
  const [mode, setMode] = useState<'register' | 'login'>('login')
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [showEmail, setShowEmail] = useState(!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    if (!open || !clientId) return

    const existing = document.getElementById('google-gis')
    const init = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) return
          setPending(true)
          try {
            const res = await fetch('/api/app-auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'google', credential: response.credential }),
            })
            const result = (await res.json()) as {
              ok: boolean
              message: string
              user?: AppUserView
            }
            setFeedback({ text: result.message, ok: result.ok })
            if (result.ok && result.user) onAuthenticated(result.user)
          } catch {
            setFeedback({ text: 'Google арқылы кіру сәтсіз.', ok: false })
          } finally {
            setPending(false)
          }
        },
      })
      const btn = document.getElementById('google-btn-slot')
      if (btn) {
        btn.innerHTML = ''
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
        })
      }
    }

    if (existing) {
      init()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.id = 'google-gis'
    s.onload = init
    document.body.appendChild(s)
  }, [open, clientId, onAuthenticated])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setFeedback(null)
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const response = await fetch('/api/app-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, action: mode }),
      })
      const result = (await response.json()) as {
        ok: boolean
        message: string
        user?: AppUserView
      }
      setFeedback({ text: result.message, ok: result.ok })
      if (result.ok && result.user) onAuthenticated(result.user)
    } catch {
      setFeedback({ text: 'Байланыс қатесі. Қайта көріңіз.', ok: false })
    } finally {
      setPending(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#10261e]/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="my-4 w-full max-w-[400px] rounded-3xl bg-white p-7 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0B4F3C] text-white">
              <Icon name="leaf" size={20} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-emerald-700">BioQuest</p>
              <p className="text-[11px] text-slate-400">Генетика платформасы</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            aria-label="Жабу"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <h2 className="mt-6 font-display text-2xl font-black text-[#10261e]">
          Платформаға кіріңіз
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Бір рет басып тіркеліңіз — прогресс, рейтинг және «от» сақталады.
        </p>

        {/* Google (тек NEXT_PUBLIC_GOOGLE_CLIENT_ID қойылғанда) */}
        {clientId && (
          <>
            <div className="mt-6">
              <div id="google-btn-slot" className="flex justify-center" />
            </div>
            <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              немесе
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        {!showEmail ? (
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className={`${clientId ? '' : 'mt-6 '}w-full rounded-full border border-emerald-200 bg-emerald-50/50 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50`}
          >
            Email арқылы кіру / тіркелу
          </button>
        ) : (
          <>
            <div className={`${clientId ? '' : 'mt-6 '}grid grid-cols-2 rounded-xl bg-slate-100 p-1`}>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-lg py-2 text-sm font-bold ${mode === 'register' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}
              >
                Тіркелу
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-lg py-2 text-sm font-bold ${mode === 'login' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}
              >
                Кіру
              </button>
            </div>
            <form onSubmit={submit} className="mt-4 space-y-3">
              {mode === 'register' && (
                <input
                  className="auth-input w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  name="name"
                  required
                  minLength={2}
                  placeholder="Аты-жөніңіз"
                />
              )}
              <input
                className="auth-input w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                name="email"
                type="email"
                required
                placeholder="email@gmail.com"
              />
              <input
                className="auth-input w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Құпиясөз"
              />
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-[#0B4F3C] py-3 text-sm font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
              >
                {pending ? 'Күте тұрыңыз...' : mode === 'register' ? 'Тіркелу' : 'Кіру'}
              </button>
            </form>
          </>
        )}

        {feedback && (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-xs font-bold ${
              feedback.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
          Кіру арқылы пайдалану шарттарымен келісесіз. Деректер тек оқу прогресі үшін.
        </p>
      </div>
    </div>
  )
}
