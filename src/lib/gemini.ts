/** Client-side Gemini check (API key stored in localStorage by user). */

export type AiCheckResult = {
  score: number // 0-100
  feedback: string
  strengths: string[]
  improvements: string[]
}

function stripCodeFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
}

/** Extract first balanced {...} block */
function extractJsonObject(text: string): string | null {
  const cleaned = stripCodeFences(text)
  const start = cleaned.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return cleaned.slice(start, i + 1)
    }
  }
  return null
}

/** Soft parse: fix common Gemini JSON issues */
function softParseJson(raw: string): Record<string, unknown> | null {
  const candidates = [raw]
  // Replace raw newlines inside strings with \n
  candidates.push(raw.replace(/[\r\n]+/g, ' '))
  // Trailing commas
  candidates.push(raw.replace(/,\s*([}\]])/g, '$1').replace(/[\r\n]+/g, ' '))

  for (const c of candidates) {
    try {
      return JSON.parse(c) as Record<string, unknown>
    } catch {
      /* try next */
    }
  }

  // Regex fallback for score + feedback
  const scoreMatch = raw.match(/"score"\s*:\s*(\d+)/)
  const feedbackMatch = raw.match(/"feedback"\s*:\s*"((?:[^"\\]|\\.)*)"/) ||
    raw.match(/"feedback"\s*:\s*"([^"]*)/)
  if (scoreMatch) {
    return {
      score: Number(scoreMatch[1]),
      feedback: feedbackMatch ? feedbackMatch[1].replace(/\\n/g, ' ') : 'Жауап бағаланды.',
      strengths: [],
      improvements: [],
    }
  }
  return null
}

function normalizeResult(parsed: Record<string, unknown>, fallbackText: string): AiCheckResult {
  let score = Number(parsed.score)
  if (!Number.isFinite(score)) score = 70
  score = Math.max(0, Math.min(100, Math.round(score)))

  const feedback = String(parsed.feedback || '').trim() || fallbackText.slice(0, 300) || 'Жауап қабылданды.'

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.map(String).filter(Boolean)
    : []
  const improvements = Array.isArray(parsed.improvements)
    ? parsed.improvements.map(String).filter(Boolean)
    : []

  return { score, feedback, strengths, improvements }
}

/**
 * Модельдер тізбегі: біріншісі жауап бермесе (429/503/404), келесісіне ауысады.
 * gemini-2.0-flash пен 2.5-flash ескірген, сондықтан олар енді қолданылмайды.
 */
export const GEMINI_MODELS = [
  'gemini-3.8-flash', // ең жаңа Flash
  'gemini-3.6-flash', // тұрақты резерв
  'gemini-3.5-flash-lite', // жеңіл, жылдам, лимиті кеңірек
] as const

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

class GeminiHttpError extends Error {
  status: number
  body: string
  retryAfterMs: number | null
  constructor(status: number, body: string, retryAfterMs: number | null) {
    super(`Gemini ${status}`)
    this.status = status
    this.body = body
    this.retryAfterMs = retryAfterMs
  }
}

/** Жауаптан "retryDelay": "12s" немесе Retry-After оқу */
function readRetryDelayMs(res: Response, body: string): number | null {
  const header = res.headers.get('retry-after')
  if (header && Number.isFinite(Number(header))) return Number(header) * 1000
  const m = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/)
  return m ? Math.ceil(Number(m[1]) * 1000) : null
}

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string,
  signal: AbortSignal,
  withThinking: boolean,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
  }
  // Ойлануды азайтамыз: тексеру жылдам болады
  if (withThinking) generationConfig.thinkingConfig = { thinkingLevel: 'low' }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig }),
    signal,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new GeminiHttpError(res.status, body, readRetryDelayMs(res, body))
  }
  const data = await res.json()
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string; thought?: boolean }) => (p.thought ? '' : p.text || ''))
      .join('') || ''
  )
}

/**
 * Бір модельге: 503/500/504/429 болса 2 рет қайталайды (күту уақыты өсіп отырады).
 * Күту ұзақ болса (мысалы күндік квота) қайталамай, келесі модельге өтеді.
 */
async function callWithRetry(model: string, apiKey: string, prompt: string): Promise<string> {
  const MAX_ATTEMPTS = 3
  let withThinking = true
  let lastErr: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 25_000)
    try {
      return await callGemini(model, apiKey, prompt, ctrl.signal, withThinking)
    } catch (err) {
      lastErr = err
      if (err instanceof GeminiHttpError) {
        // thinkingConfig қолдамайтын модель болса — сонысыз қайта жібереміз
        if (err.status === 400 && /think/i.test(err.body) && withThinking) {
          withThinking = false
          attempt--
          continue
        }
        const retryable = [429, 500, 503, 504].includes(err.status)
        if (!retryable) throw err
        const wait = err.retryAfterMs ?? 800 * 2 ** attempt + Math.random() * 400
        if (wait > 8_000) throw err // ұзақ күту — келесі модельге
        if (attempt < MAX_ATTEMPTS - 1) await sleep(wait)
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        // тайм-аут — қайталап көреміз
      } else {
        throw err // желі қатесі т.б.
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr
}

function friendlyError(err: unknown): Error {
  if (err instanceof GeminiHttpError) {
    const b = err.body.toLowerCase()
    if (err.status === 403 || (err.status === 400 && (b.includes('api key') || b.includes('api_key')))) {
      return new Error('API кілті қате немесе қолжетімсіз. Баптаудан кілтті тексеріңіз.')
    }
    if (err.status === 429) {
      return new Error('Gemini лимиті толды (тегін квота). 1 минуттан кейін қайталаңыз.')
    }
    if (err.status === 503 || err.status === 500 || err.status === 504) {
      return new Error('Gemini қазір бос емес (серверде жүктеме көп). Бірнеше секундтан кейін қайталаңыз.')
    }
    return new Error(`Gemini қатесі (${err.status}): ${err.body.slice(0, 200)}`)
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new Error('Gemini жауап бермеді (тайм-аут). Қайталап көріңіз.')
  }
  return err instanceof Error ? err : new Error('Белгісіз қате')
}

export async function checkWithGemini(params: {
  apiKey: string
  lessonTitle: string
  task: string
  studentAnswer: string
  model?: string
}): Promise<AiCheckResult> {
  const { apiKey, lessonTitle, task, studentAnswer, model } = params

  if (!apiKey.trim()) {
    throw new Error('API кілті енгізілмеген. Баптаудан Gemini API кілтін қосыңыз.')
  }
  if (!studentAnswer.trim()) {
    throw new Error('Жауап жазылмаған.')
  }

  const prompt = `Сен қазақ тіліндегі мейірімді генетика/биология мұғалімісің. Оқушы жауабын қолдаушы түрде бағала.

Сабақ: ${lessonTitle}
Тапсырма: ${task}

Оқушы жауабы:
"""
${studentAnswer}
"""

Бағалау ережелері:
- Мазмұнды, логикалық, ұғымдарды дұрыс қолданған жауапқа 85–100 балл бер.
- Негізгі ой дұрыс, бірақ қысқа болса 70–84.
- Жартылай дұрыс немесе үстіртін болса 55–69.
- Өте әлсіз немесе тақырыптан тыс болса ғана 40-тан төмен қой.
- Кіші қателер үшін қатты айыппұл қойма; күшті жақтарын міндетті түрде ата.
- feedback, strengths, improvements — тек қазақ тілінде, адам оқитын мәтін (JSON ішіндегі жолдарда нақты жаңа жол қойма, бір жолмен жаз).

Тек бір JSON объектін қайтар. Басқа мәтін, markdown, түсініктеме ЖОҚ.
Формат:
{"score":90,"feedback":"Қысқа пікір бір-екі сөйлем.","strengths":["Күшті жақ 1","Күшті жақ 2"],"improvements":["Кіші кеңес 1"]}`

  const models = model ? [model, ...GEMINI_MODELS.filter((m) => m !== model)] : [...GEMINI_MODELS]

  let text = ''
  let lastErr: unknown
  for (const m of models) {
    try {
      text = await callWithRetry(m, apiKey, prompt)
      lastErr = undefined
      break
    } catch (err) {
      lastErr = err
      // Кілт қате болса — басқа модельді сынаудың қажеті жоқ
      if (err instanceof GeminiHttpError && (err.status === 403 || (err.status === 400 && /api.?key/i.test(err.body)))) {
        break
      }
      // 429/503/404/тайм-аут болса — келесі модельге
    }
  }
  if (lastErr) throw friendlyError(lastErr)

  const jsonStr = extractJsonObject(text) || stripCodeFences(text)
  const parsed = jsonStr ? softParseJson(jsonStr) : softParseJson(text)

  if (parsed) {
    return normalizeResult(parsed, text)
  }

  // Соңғы fallback — JSON жоқ, бірақ мәтін бар
  const clean = stripCodeFences(text).replace(/[{}\[\]"]/g, ' ').replace(/\s+/g, ' ').trim()
  return {
    score: 75,
    feedback: clean.slice(0, 400) || 'Жауап қабылданды. Қайта тексеріп көріңіз.',
    strengths: ['Жауап жіберілді'],
    improvements: ['Қажет болса жауапты қысқаша қайта жазып тексеріңіз'],
  }
}

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem('bioquest-gemini-key') || ''
  } catch {
    return ''
  }
}

export function setStoredApiKey(key: string) {
  try {
    localStorage.setItem('bioquest-gemini-key', key)
  } catch {
    /* ignore */
  }
}

export type ThemeMode = 'light' | 'dark'
export type FontScale = 'sm' | 'md' | 'lg'

export function getTheme(): ThemeMode {
  try {
    return (localStorage.getItem('bioquest-theme') as ThemeMode) || 'light'
  } catch {
    return 'light'
  }
}

export function setTheme(mode: ThemeMode) {
  try {
    localStorage.setItem('bioquest-theme', mode)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    document.documentElement.style.colorScheme = mode
  }
}

export function getFontScale(): FontScale {
  try {
    return (localStorage.getItem('bioquest-font') as FontScale) || 'md'
  } catch {
    return 'md'
  }
}

export function setFontScale(scale: FontScale) {
  try {
    localStorage.setItem('bioquest-font', scale)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.font = scale
  }
}
