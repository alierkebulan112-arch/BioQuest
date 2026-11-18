import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { cookies } from 'next/headers'

/**
 * Өз бетінше жұмыс істейтін auth (Payload/Figma backend керек емес).
 * Қолданушылар DATA_DIR/users.json файлында сақталады, құпиясөз scrypt-пен хэштеледі,
 * сессия — HMAC-қол қойылған httpOnly cookie.
 */

export const APP_SESSION_COOKIE = 'app-session'
const SESSION_DAYS = 30

export type AppUserView = {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher'
}

type StoredUser = AppUserView & { passwordHash: string; createdAt: string }

export class AuthError extends Error {
  constructor(
    public code: 'email-taken' | 'bad-credentials',
    message: string,
  ) {
    super(message)
  }
}

/* ---------- сақтау (JSON файл) ---------- */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const SECRET_FILE = path.join(DATA_DIR, 'session.key')

function ensureDir() {
  mkdirSync(DATA_DIR, { recursive: true })
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(readFileSync(USERS_FILE, 'utf8')) as StoredUser[]
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  ensureDir()
  const tmp = `${USERS_FILE}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8')
  renameSync(tmp, USERS_FILE) // атомарлы жазу
}

// Бір процесс ішінде жазуларды кезекке қоямыз (race condition болмасын)
let queue: Promise<unknown> = Promise.resolve()
function exclusive<T>(fn: () => T): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.catch(() => undefined)
  return run
}

/* ---------- криптография ---------- */

let cachedSecret: string | null = null
function sessionSecret(): string {
  if (cachedSecret) return cachedSecret
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    cachedSecret = process.env.SESSION_SECRET
    return cachedSecret
  }
  ensureDir()
  if (existsSync(SECRET_FILE)) {
    cachedSecret = readFileSync(SECRET_FILE, 'utf8').trim()
  } else {
    cachedSecret = randomBytes(32).toString('hex')
    writeFileSync(SECRET_FILE, cachedSecret, { mode: 0o600 })
  }
  return cachedSecret
}

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected)
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
}

function makeToken(userId: string): { token: string; expires: Date } {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: expires.getTime() })).toString(
    'base64url',
  )
  return { token: `${payload}.${sign(payload)}`, expires }
}

function readToken(token: string): string | null {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string
      exp?: number
    }
    if (!data.uid || !data.exp || data.exp < Date.now()) return null
    return data.uid
  } catch {
    return null
  }
}

/* ---------- ашық API ---------- */

function toView(user: StoredUser): AppUserView {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

async function startSession(user: StoredUser) {
  const { token, expires } = makeToken(user.id)
  const store = await cookies()
  store.set(APP_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // COOKIE_SECURE=0 болса HTTP-де де жұмыс істейді (мысалы, жергілікті Docker сынағы)
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== '0',
    path: '/',
    expires,
  })
}

export const appAuth = {
  async currentUser(): Promise<AppUserView | null> {
    const token = (await cookies()).get(APP_SESSION_COOKIE)?.value
    if (!token) return null
    const uid = readToken(token)
    if (!uid) return null
    const user = readUsers().find((u) => u.id === uid)
    return user ? toView(user) : null
  },

  async register(input: {
    email: string
    name: string
    password: string
    role: 'student' | 'teacher'
  }): Promise<AppUserView> {
    const user = await exclusive(() => {
      const users = readUsers()
      if (users.some((u) => u.email === input.email)) {
        throw new AuthError('email-taken', 'Бұл email бұрын тіркелген.')
      }
      const created: StoredUser = {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash: hashPassword(input.password),
        createdAt: new Date().toISOString(),
      }
      users.push(created)
      writeUsers(users)
      return created
    })
    await startSession(user)
    return toView(user)
  },

  async login(input: { email: string; password: string }): Promise<AppUserView> {
    const user = readUsers().find((u) => u.email === input.email)
    // Қолданушы жоқ болса да хэш есептейміз (timing айырмасы білінбесін)
    const ok = user
      ? verifyPassword(input.password, user.passwordHash)
      : (hashPassword(input.password), false)
    if (!user || !ok) throw new AuthError('bad-credentials', 'Email немесе құпиясөз дұрыс емес.')
    await startSession(user)
    return toView(user)
  },

  /** Google ID token тексерілгеннен кейін шақырылады. Құпиясөзсіз тіркеледі/кіреді. */
  async loginWithVerifiedEmail(input: { email: string; name: string }): Promise<AppUserView> {
    const user = await exclusive(() => {
      const users = readUsers()
      const existing = users.find((u) => u.email === input.email)
      if (existing) return existing
      const created: StoredUser = {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        role: 'student',
        // кездейсоқ құпиясөз — осы арқылы email-мен кіруге болмайды
        passwordHash: hashPassword(randomBytes(32).toString('hex')),
        createdAt: new Date().toISOString(),
      }
      users.push(created)
      writeUsers(users)
      return created
    })
    await startSession(user)
    return toView(user)
  },

  async logout() {
    ;(await cookies()).delete(APP_SESSION_COOKIE)
  },
}
