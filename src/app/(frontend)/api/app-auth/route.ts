import { appAuth, AuthError } from '@/lib/app-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

/** Google ID token-ды Google-дың өзі арқылы тексереміз (aud = біздің Client ID). */
async function verifyGoogleCredential(credential: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId || !credential) return null
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    { cache: 'no-store' },
  )
  if (!res.ok) return null
  const info = (await res.json()) as {
    aud?: string
    email?: string
    email_verified?: string | boolean
    name?: string
  }
  if (info.aud !== clientId || !info.email) return null
  if (info.email_verified !== true && info.email_verified !== 'true') return null
  return { email: info.email.toLowerCase(), name: info.name || info.email.split('@')[0] }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const action = clean(body.action)

    if (action === 'google') {
      const profile = await verifyGoogleCredential(clean(body.credential))
      if (!profile) return fail('Google арқылы кіру расталмады.', 401)
      const user = await appAuth.loginWithVerifiedEmail(profile)
      return NextResponse.json({ ok: true, message: 'Қош келдіңіз!', user })
    }

    const email = clean(body.email).toLowerCase()
    const password = clean(body.password)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Email адресін дұрыс енгізіңіз.')
    if (password.length < 6 || password.length > 128)
      return fail('Құпиясөз кемінде 6 таңбадан тұруы керек.')

    if (action === 'login') {
      const user = await appAuth.login({ email, password })
      return NextResponse.json({ ok: true, message: 'Қош келдіңіз!', user })
    }

    if (action === 'register') {
      const name = clean(body.name)
      const role = clean(body.role) === 'teacher' ? 'teacher' : 'student'
      if (name.length < 2 || name.length > 80) return fail('Аты-жөніңізді дұрыс енгізіңіз.')

      const user = await appAuth.register({ name, email, password, role })
      return NextResponse.json({ ok: true, message: 'Тіркелу сәтті аяқталды.', user })
    }

    return fail('Белгісіз әрекет.')
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.code === 'bad-credentials' ? 401 : 409)
    }
    console.error('[app-auth]', error)
    return fail('Әрекет орындалмады. Деректерді тексеріп, қайта көріңіз.', 500)
  }
}

export async function DELETE() {
  await appAuth.logout()
  return NextResponse.json({ ok: true })
}
