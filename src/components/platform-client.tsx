'use client'

import {
  sections,
  allLessons,
  testQuestions,
  selfAssessmentRubric,
  leaderboardDemo,
  type Lesson,
  type LessonTask,
  type Role,
} from '@/lib/course-data'
import type { AppUserView } from '@/lib/app-auth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { AuthDialog } from './auth-dialog'
import { Icon } from './edu-icons'
import {
  checkWithGemini,
  getStoredApiKey,
  setStoredApiKey,
  getTheme,
  setTheme,
  getFontScale,
  setFontScale,
  type ThemeMode,
  type FontScale,
  type AiCheckResult,
} from '@/lib/gemini'

type Screen =
  | { type: 'home' }
  | { type: 'list'; role: Role }
  | { type: 'lesson'; role: Role; lesson: Lesson }
  | { type: 'test'; role: Role }
  | { type: 'self'; role: Role }
  | { type: 'rank'; role: Role }

function Flame({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${days} күн қатарынан`}>
      <Icon name="fire" size={18} className="text-orange-500" />
      <span className="text-xs font-extrabold text-orange-600">{days}</span>
    </span>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}

export function PlatformClient() {
  const [user, setUser] = useState<AppUserView | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>({ type: 'home' })
  const [streak, setStreak] = useState(4)
  const [completed, setCompleted] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setThemeState] = useState<ThemeMode>('light')
  const [fontScale, setFontScaleState] = useState<FontScale>('md')
  const [apiKey, setApiKey] = useState('')
  const [writtenAnswer, setWrittenAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AiCheckResult | null>(null)
  const [aiError, setAiError] = useState('')
  const [lessonSlide, setLessonSlide] = useState(0)
  const [presenting, setPresenting] = useState(false)
  const [reflection, setReflection] = useState('')
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({})
  const router = useRouter()
  const searchParams = useSearchParams()

  const go = useCallback(
    (next: Screen) => {
      setScreen(next)
      const params = new URLSearchParams()
      if (next.type === 'list') {
        params.set('view', 'list')
        params.set('role', next.role)
      } else if (next.type === 'lesson') {
        params.set('view', 'lesson')
        params.set('role', next.role)
        params.set('id', next.lesson.id)
      } else if (next.type === 'test' || next.type === 'self' || next.type === 'rank') {
        params.set('view', next.type)
        params.set('role', next.role)
      } else {
        params.set('view', 'home')
      }
      const q = params.toString()
      router.replace(q ? `/platform?${q}` : '/platform', { scroll: false })
    },
    [router],
  )

  // URL → screen (so refresh / direct link works)
  useEffect(() => {
    const view = searchParams.get('view') || 'home'
    const role = (searchParams.get('role') as Role) || 'student'
    const id = searchParams.get('id')
    if (view === 'list') {
      setScreen({ type: 'list', role })
    } else if (view === 'lesson' && id) {
      const lesson = allLessons.find((l) => l.id === id)
      if (lesson) setScreen({ type: 'lesson', role, lesson })
      else setScreen({ type: 'list', role })
    } else if (view === 'test' || view === 'self' || view === 'rank') {
      setScreen({ type: view, role })
    } else {
      setScreen({ type: 'home' })
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/app-session')
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user))
      .catch(() => undefined)

    try {
      const key = 'bioquest-streak'
      const raw = localStorage.getItem(key)
      const today = new Date().toDateString()
      if (raw) {
        const p = JSON.parse(raw) as { days: number; last: string }
        if (p.last === today) setStreak(p.days)
        else {
          const y = new Date()
          y.setDate(y.getDate() - 1)
          if (p.last === y.toDateString()) {
            const n = p.days + 1
            setStreak(n)
            localStorage.setItem(key, JSON.stringify({ days: n, last: today }))
          } else {
            setStreak(1)
            localStorage.setItem(key, JSON.stringify({ days: 1, last: today }))
          }
        }
      } else {
        localStorage.setItem(key, JSON.stringify({ days: 4, last: today }))
      }
      const c = localStorage.getItem('bioquest-completed')
      if (c) setCompleted(JSON.parse(c))
      const t = getTheme()
      setThemeState(t)
      setTheme(t)
      const f = getFontScale()
      setFontScaleState(f)
      setFontScale(f)
      setApiKey(getStoredApiKey())
    } catch {
      /* ignore */
    }
  }, [])

  const markDone = (id: string) => {
    setCompleted((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try {
        localStorage.setItem('bioquest-completed', JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const progress = Math.round((completed.length / allLessons.length) * 100)

  const filteredLessons = useMemo(() => {
    return allLessons.filter((l) => {
      const matchSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.number.includes(search)
      const matchSection = sectionFilter === 'all' || l.sectionId === sectionFilter
      return matchSearch && matchSection
    })
  }, [search, sectionFilter])

  // ——— HOME: role selection ———
  if (screen.type === 'home') {
    return (
      <div className="min-h-screen bg-[#f7f6f1]">
        <header className="border-b border-emerald-900/10 bg-[#f7f6f1]/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-800 text-white">
                <Icon name="leaf" size={16} />
              </span>
              <span className="font-display text-sm font-black text-emerald-950">BioQuest</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Flame days={streak} />
              <button
                onClick={() => setSettingsOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                title="Баптау"
              >
                <Icon name="spark" size={16} />
              </button>
              {user ? (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                  {user.name.charAt(0)}
                </span>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold"
                >
                  <Icon name="google" size={14} /> Кіру
                </button>
              )}
            </div>
          </div>
        </header>

                <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                BioQuest · генетика платформасы
              </p>
              <h1 className="mt-3 max-w-2xl font-display text-3xl font-black leading-[1.15] tracking-tight text-[#10261e] sm:text-4xl md:text-[2.75rem]">
                Биотехнология және генетика негіздерін мәселеге бейімдеп оқыту
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#4A5D54]">
                34 сабақ · тәжірибелік тапсырмалар · ИИ көмекшісі · мұғалім ресурстары
              </p>
              <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/platform?view=list&role=student"
                  className="group block cursor-pointer rounded-2xl bg-[#0B4F3C] p-7 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-emerald-200">
                    Оқушыға
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-black">Өз бетімен үйренемін</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/85">
                    Тапсырма, көмек және өзіңді бағалау
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-4 py-2 text-xs font-extrabold text-[#10261e]">
                    Бастайық <Icon name="arrow" size={14} />
                  </span>
                </Link>
                <Link
                  href="/platform?view=list&role=teacher"
                  className="group block cursor-pointer rounded-2xl border border-emerald-200 bg-white p-7 text-left transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-emerald-600">
                    Мұғалімге
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-black text-[#10261e]">
                    Сабақта қолданамын
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#4A5D54]">
                    Түсіндірме, тапсырма
                  </p>
                </Link>
              </div>
            </div>
            <div className="relative mx-auto hidden w-full max-w-sm lg:block">
              <div className="absolute -inset-6 rounded-full bg-emerald-100/60 blur-2xl" />
              <img
                src="/landing/microscope-cutout.png"
                alt="ДНҚ спиралі"
                className="relative mx-auto w-full max-w-[340px]"
              />
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-5 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div
              className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full ring-progress"
              style={ { ["--p"]: String(progress) } as Record<string, string> }
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white font-display text-lg font-black text-[#0B4F3C]">
                {progress}%
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Жалпы прогресс
              </p>
              <p className="mt-1 font-display text-xl font-black text-[#10261e]">
                {completed.length} / {allLessons.length} сабақ өтілді
              </p>
              <div className="mt-3 max-w-md">
                <ProgressBar value={progress} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Flame days={streak} />
              <button
                type="button"
                onClick={() => go({ type: 'list', role: 'student' })}
                className="rounded-xl bg-[#0B4F3C] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-900"
              >
                Жалғастыру →
              </button>
            </div>
          </div>
        </main>

        {authOpen && (
          <AuthDialog
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            onAuthenticated={(u) => {
              setUser(u)
              setAuthOpen(false)
            }}
          />
        )}
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          fontScale={fontScale}
          apiKey={apiKey}
          user={user}
          onTheme={(t) => {
            setThemeState(t)
            setTheme(t)
          }}
          onFont={(f) => {
            setFontScaleState(f)
            setFontScale(f)
          }}
          onApiKey={setApiKey}
          onAuth={() => {
            setSettingsOpen(false)
            setAuthOpen(true)
          }}
        />
      </div>
    )
  }

  // ——— LIST ———
  if (screen.type === 'list') {
    const isTeacher = screen.role === 'teacher'
    return (
      <div className="min-h-screen bg-[#f7f6f1]">
        <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-[#f7f6f1]/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <button
              onClick={() => go({ type: 'home' })}
              className="flex items-center gap-2 text-sm font-bold text-emerald-800"
            >
              <Icon name="arrow" size={16} className="rotate-180" /> Артқа
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Flame days={streak} />
              <button
                onClick={() => go({ type: 'rank', role: screen.role })}
                className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800"
              >
                Топ
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-800"
                title="Баптау"
              >
                <Icon name="spark" size={16} />
              </button>
              <button
                onClick={() => setAuthOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 bg-white"
                title="Google"
              >
                <Icon name="google" size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {/* Role switch hint */}
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => go({ type: 'list', role: 'student' })}
              className={`rounded-2xl p-5 text-left transition ${
                !isTeacher
                  ? 'bg-emerald-900 text-white shadow-md'
                  : 'border border-emerald-100 bg-emerald-50/60 text-emerald-900'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                Оқушыға
              </p>
              <p className="mt-1 font-display text-lg font-black">Өз бетімен үйренемін</p>
            </button>
            <button
              onClick={() => go({ type: 'list', role: 'teacher' })}
              className={`rounded-2xl p-5 text-left transition ${
                isTeacher
                  ? 'bg-emerald-900 text-white shadow-md'
                  : 'border border-emerald-100 bg-emerald-50/60 text-emerald-900'
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">
                Мұғалімге
              </p>
              <p className="mt-1 font-display text-lg font-black">Сабақта қолданамын</p>
            </button>
          </div>

          <h2 className="font-display text-2xl font-black text-emerald-950">
            {isTeacher ? 'Мұғалімнің ресурстары' : 'Менің сабақтарым'}
          </h2>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Сабақ атауы немесе нөмірі"
              className="flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400"
            >
              <option value="all">Барлық бөлім</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.number}. {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 grid gap-0 sm:grid-cols-2">
            {filteredLessons.map((lesson) => {
              const done = completed.includes(lesson.id)
              return (
                <button
                  type="button"
                  key={lesson.id}
                  onClick={() => {
                      setWrittenAnswer('')
                      setAiResult(null)
                      setAiError('')
                      setLessonSlide(0)
                      go({ type: 'lesson', role: screen.role, lesson })
                    }}
                  className="flex items-start gap-4 border-t border-emerald-900/10 px-2 py-5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0B4F3C] font-display text-sm font-black text-white">
                    {lesson.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-black text-[#10261e]">
                      {lesson.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-[#4A5D54]">
                        {lesson.duration}
                      </span>
                      {done ? (
                        <span className="rounded-full bg-[#2ECC8F]/20 px-2.5 py-0.5 text-[10px] font-extrabold text-[#0B4F3C]">
                          ✓ Өтілді
                        </span>
                      ) : lesson.full ? (
                        <span className="rounded-full bg-[#1F8A9E]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#1F8A9E]">
                          Дайын
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-500">
                          Қысқа
                        </span>
                      )}
                    </div>
                  </div>
                  <Icon name="arrow" size={18} className="mt-2 shrink-0 text-emerald-600" />
                </button>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={() => go({ type: 'test', role: screen.role })}
              className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-900"
            >
              Қорытынды тест
            </button>
            <button
              onClick={() => go({ type: 'self', role: screen.role })}
              className="rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-900"
            >
              Өзін-өзі бағалау
            </button>
          </div>
        </main>

        {authOpen && (
          <AuthDialog
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            onAuthenticated={(u) => {
              setUser(u)
              setAuthOpen(false)
            }}
          />
        )}
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          fontScale={fontScale}
          apiKey={apiKey}
          user={user}
          onTheme={(t) => {
            setThemeState(t)
            setTheme(t)
          }}
          onFont={(f) => {
            setFontScaleState(f)
            setFontScale(f)
          }}
          onApiKey={setApiKey}
          onAuth={() => {
            setSettingsOpen(false)
            setAuthOpen(true)
          }}
        />
      </div>
    )
  }

  // ——— LESSON ———

  if (screen.type === 'lesson') {
    const { lesson, role } = screen
    const isTeacher = role === 'teacher'
    const done = completed.includes(lesson.id)

    const H = 'mt-3 font-display text-2xl font-black text-[#10261e]'
    const tasks = lessonTasks(lesson)
    const media = lessonImages(lesson)
    const hasMedia = media.length > 0 || !!lesson.videoUrl
    const chunks = chunkText(lesson.content)
    const totalPoints = tasks.reduce((n, tk) => n + (tk.points ?? 0), 0)

    // ——— Оқушы: түсіндірме → 1, 2, 3-тапсырма (әрқайсысы бөлек бет) → тексеру беті ———
    const steps = [
      { key: 'explain', label: 'Түсіндірме' },
      ...tasks.map((_, t) => ({ key: `t${t}`, label: tasks.length === 1 ? 'Жұмыс парағы' : `${t + 1}-тапсырма` })),
      { key: 'check', label: 'Тексеру' },
    ]
    const step = Math.min(lessonSlide, steps.length - 1)
    const goStep = (n: number) => {
      setLessonSlide(Math.max(0, Math.min(steps.length - 1, n)))
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const ansKey = (t: number, i: number) => `${lesson.id}:${t}:${i}`
    const ans = (t: number, i: number) => taskAnswers[ansKey(t, i)] ?? ''
    const setAns = (t: number, i: number, v: string) => {
      setTaskAnswers((prev) => ({ ...prev, [ansKey(t, i)]: v }))
      setAiResult(null)
      setAiError('')
    }
    const taskDone = (t: number) => itemsOf(tasks[t]).some((_, i) => ans(t, i).trim())
    const answeredCount = tasks.filter((_, t) => taskDone(t)).length

    const runAi = async () => {
      setAiError('')
      setAiResult(null)
      setAiLoading(true)
      try {
        const key = getStoredApiKey() || apiKey
        const taskText = tasks
          .map((tk, t) =>
            [
              `${t + 1}-тапсырма. ${tk.title}`,
              tk.instruction,
              tk.context,
              tk.table ? tk.table.rows.map((r) => r.join(' — ')).join('; ') : '',
              ...itemsOf(tk).filter(Boolean).map((q, i) => `${i + 1}) ${q}`),
              tk.rubric ? `Бағалау: ${tk.rubric}` : '',
            ]
              .filter(Boolean)
              .join('\n')
              .replace(/\*\*/g, ''),
          )
          .join('\n\n')
        const answerText = tasks
          .map(
            (tk, t) =>
              `${t + 1}-тапсырма:\n` +
              itemsOf(tk)
                .map((_, i) => `${i + 1}) ${ans(t, i).trim() || '(жауап жоқ)'}`)
                .join('\n'),
          )
          .join('\n\n')
        setAiResult(await checkWithGemini({ apiKey: key, lessonTitle: lesson.title, task: taskText, studentAnswer: answerText }))
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'Қате')
      } finally {
        setAiLoading(false)
      }
    }

    // ——— Мұғалім: тек 4 бөлім — мақсат, проблемалық сұрақ, түсіндірме материалдар, жағдаяттық тапсырма ———
    const blocks: Block[] = []
    if (isTeacher) {
      blocks.push({
        label: 'Сабақ мақсаты',
        skipInDeck: true,
        node: (
          <div>
            <Label>Сабақ мақсаты</Label>
            <p className="mt-3 text-base leading-8 text-slate-700">{lesson.goal}</p>
          </div>
        ),
      })
      blocks.push({
        label: 'Проблемалық сұрақ',
        node: (
          <div>
            <Label>Проблемалық сұрақ</Label>
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-xl font-black leading-8 text-[#10261e]">{lesson.question}</p>
            </div>
            {lesson.problemImage && (
              <img src={lesson.problemImage} alt="" className="mt-4 max-h-[26rem] w-full rounded-2xl border border-emerald-100 bg-white object-contain" />
            )}
          </div>
        ),
      })
      chunks.forEach((c, k) =>
        blocks.push({
          label: 'Түсіндірме',
          node: (
            <div>
              {k === 0 && <Label>Түсіндірме материалдар</Label>}
              <div className={`${k === 0 ? 'mt-3 ' : ''}whitespace-pre-line text-base leading-8 text-slate-700`}>
                <Rich text={c} />
              </div>
            </div>
          ),
        }),
      )
      if (hasMedia)
        blocks.push({
          label: 'Көрнекілік',
          node: <LessonMedia lesson={lesson} compact />,
        })
      blocks.push({
        label: 'Жағдаят',
        node: (
          <div>
            <Label>Жағдаяттық тапсырма</Label>
            {lesson.situationTitle && <h3 className="mt-3 font-display text-xl font-black text-[#10261e]">{lesson.situationTitle}</h3>}
            <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-700">
              <Rich text={lesson.situation} />
            </p>
            {lesson.caseTask && (
              <div className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                <Rich text={lesson.caseTask} />
              </div>
            )}
            {lesson.caseTable && <SimpleTable table={lesson.caseTable} />}
          </div>
        ),
      })
    }

    const goBtn = 'rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-50 disabled:opacity-40'
    const nextBtn = 'rounded-xl bg-[#0B4F3C] px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-40'

    const studentStage = (
      <div>
        {/* Қадамдар */}
        <ol className="flex flex-wrap items-center gap-2">
          {steps.map((st, k) => {
            const isTask = st.key.startsWith('t')
            const filled = isTask && taskDone(Number(st.key.slice(1)))
            return (
              <li key={st.key}>
                <button
                  type="button"
                  onClick={() => goStep(k)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
                    k === step
                      ? 'border-[#0B4F3C] bg-[#0B4F3C] text-white'
                      : filled
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                        : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  {filled && k !== step ? '✓ ' : ''}
                  {st.label}
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-8">
          {steps[step].key === 'explain' && (
            <div>
              <Label>Түсіндірме</Label>
              <h2 className={H}>{lesson.title}</h2>
              <div className="mt-5 whitespace-pre-line text-base leading-8 text-slate-700">
                <Rich text={lesson.content ?? lesson.summary} />
              </div>
              {hasMedia && <LessonMedia lesson={lesson} />}
            </div>
          )}

          {steps[step].key.startsWith('t') && (
            <TaskPage
              index={Number(steps[step].key.slice(1))}
              task={tasks[Number(steps[step].key.slice(1))]}
              worksheetTitle={lesson.worksheetTitle}
              worksheetGoal={Number(steps[step].key.slice(1)) === 0 ? lesson.worksheetGoal : undefined}
              printUrl={lesson.worksheetImage}
              single={tasks.length === 1}
              getAns={ans}
              setAns={setAns}
            />
          )}

          {steps[step].key === 'check' && (
            <div>
              <Label>Тексеру</Label>
              <h2 className={H}>Жауаптарыңды тексер</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Толтырылған тапсырма: {answeredCount} / {tasks.length}
                {totalPoints > 0 && <> · Жалпы бағалау: {totalPoints} ұпай (0–10 шкала)</>}
              </p>
              <div className="mt-5 space-y-4">
                {tasks.map((tk, t) => (
                  <div key={t} className="rounded-2xl border border-emerald-100 bg-[#f4faf6] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-extrabold text-[#10261e]">{t + 1}-тапсырма. {tk.title}</p>
                      <button type="button" onClick={() => goStep(t + 1)} className="shrink-0 text-xs font-bold text-emerald-700 hover:underline">
                        Өзгерту
                      </button>
                    </div>
                    <ol className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700">
                      {itemsOf(tk).map((_, i) => (
                        <li key={i}>
                          <span className="font-bold text-emerald-700">{itemsOf(tk).length > 1 ? `${i + 1}) ` : ''}</span>
                          {ans(t, i).trim() || <span className="text-slate-400">— жауап жоқ —</span>}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={aiLoading || answeredCount === 0}
                onClick={runAi}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B4F3C] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                <Icon name="spark" size={14} />
                {aiLoading ? 'Тексерілуде...' : 'ИИ-ге жіберу · 0–10 баға'}
              </button>
              {aiError && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{aiError}</p>}
              {aiResult && (
                <div className="mt-4 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-lg font-black text-emerald-900">Баға: {Math.round(aiResult.score / 10)} / 10</p>
                  <p className="text-sm leading-6 text-slate-700">{aiResult.feedback.replace(/```json/gi, '').replace(/```/g, '').trim()}</p>
                  {aiResult.strengths.length > 0 && <ul className="list-inside list-disc text-xs text-slate-600">{aiResult.strengths.map((x) => <li key={x}>{x}</li>)}</ul>}
                  {aiResult.improvements.length > 0 && <ul className="list-inside list-disc text-xs text-slate-600">{aiResult.improvements.map((x) => <li key={x}>{x}</li>)}</ul>}
                </div>
              )}
              <div className="mt-6">
                {done ? (
                  <span className="rounded-xl bg-emerald-100 px-4 py-2.5 text-xs font-extrabold text-emerald-800">✓ Өтілді</span>
                ) : (
                  <button type="button" onClick={() => markDone(lesson.id)} className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50">
                    Сабақты аяқтау
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-emerald-100 pt-5">
          <button type="button" disabled={step === 0} onClick={() => goStep(step - 1)} className={goBtn}>
            ← Алдыңғы
          </button>
          <p className="text-xs font-bold text-[#4A5D54]">{step + 1} / {steps.length}</p>
          <button type="button" disabled={step === steps.length - 1} onClick={() => goStep(step + 1)} className={nextBtn}>
            Келесі →
          </button>
        </div>
      </div>
    )


    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <header className="sticky top-0 z-20 border-b border-emerald-900/10 bg-[#F8F6F1]/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                type="button"
                onClick={() => go({ type: 'list', role })}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
              >
                <Icon name="arrow" size={16} className="rotate-180" />
                <span className="hidden sm:inline">Сабақтар</span>
              </button>
              <span className="text-emerald-200">|</span>
              <button
                type="button"
                onClick={() => go({ type: 'home' })}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
              >
                <Icon name="home" size={16} />
                <span className="hidden sm:inline">Басты бет</span>
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Flame days={streak} />
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                title="Баптау"
              >
                <Icon name="spark" size={16} />
              </button>
              {user ? (
                <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white py-1 pl-1 pr-2.5 shadow-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                    {user.name.charAt(0)}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                >
                  <Icon name="google" size={16} />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
            {lesson.sectionTitle} · Сабақ {lesson.number}
          </p>
          <h1 className="mt-1 font-display text-2xl font-black text-[#10261e] sm:text-3xl">
            {lesson.title}
          </h1>
          <p className="mt-1 text-sm text-[#4A5D54]">{lesson.duration}</p>
          {isTeacher && (
            <button
              type="button"
              onClick={() => setPresenting(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B4F3C] px-4 py-2.5 text-sm font-extrabold text-white shadow hover:bg-emerald-800"
            >
              ▶ Сабақты слайд ретінде ашу
            </button>
          )}
          {isTeacher && presenting && (
            <LessonDeck lesson={lesson} isTeacher={isTeacher} pages={blocks} onClose={() => setPresenting(false)} />
          )}


          {/* Slide stage */}
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8 [&>div+div]:mt-10 [&>div+div]:border-t [&>div+div]:border-emerald-100 [&>div+div]:pt-10">
            {isTeacher ? blocks.map((b, k) => <div key={k}>{b.node}</div>) : studentStage}
          </div>

        </main>

        {authOpen && (
          <AuthDialog
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            onAuthenticated={(u) => {
              setUser(u)
              setAuthOpen(false)
            }}
          />
        )}
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          fontScale={fontScale}
          apiKey={apiKey}
          user={user}
          onTheme={(th) => {
            setThemeState(th)
            setTheme(th)
          }}
          onFont={(f) => {
            setFontScaleState(f)
            setFontScale(f)
          }}
          onApiKey={setApiKey}
          onAuth={() => {
            setSettingsOpen(false)
            setAuthOpen(true)
          }}
        />
      </div>
    )
  }

  // ——— TEST ———
  // ——— TEST ———
  if (screen.type === 'test') {
    return (
      <TestScreen
        role={screen.role}
        onBack={() => go({ type: 'list', role: screen.role })}
      />
    )
  }

  // ——— SELF ———
  if (screen.type === 'self') {
    return (
      <SelfScreen
        role={screen.role}
        onBack={() => go({ type: 'list', role: screen.role })}
      />
    )
  }

  // ——— RANK ———
  if (screen.type === 'rank') {
    const top3 = leaderboardDemo.slice(0, 3)
    const rest = leaderboardDemo.slice(3)
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <header className="border-b border-emerald-900/10 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <button
              type="button"
              onClick={() => go({ type: 'list', role: screen.role })}
              className="flex items-center gap-2 text-sm font-bold text-emerald-800"
            >
              <Icon name="arrow" size={16} className="rotate-180" /> Артқа
            </button>
            <span className="text-xs font-extrabold text-emerald-700">Осы апта көшбасшылары</span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="font-display text-3xl font-black text-[#10261e]">Топ оқушылар</h1>
          <p className="mt-1 text-sm text-[#4A5D54]">
            Ұпай · күнделікті «от» · бейдж. Нақты прогресс бойынша.
          </p>

          {/* Podium */}
          <div className="mt-8 grid grid-cols-3 items-end gap-3">
            {[top3[1], top3[0], top3[2]].map((row, idx) => {
              if (!row) return null
              const place = idx === 1 ? 1 : idx === 0 ? 2 : 3
              const h = place === 1 ? 'h-36' : place === 2 ? 'h-28' : 'h-24'
              const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'
              return (
                <div key={row.name} className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-lg font-black shadow ring-2 ring-emerald-100">
                    {row.avatar}
                  </div>
                  <p className="mt-2 text-xs font-extrabold text-[#10261e]">{medal} {row.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-500">{row.score} ұпай</p>
                  <div className={`mx-auto mt-2 ${h} rounded-t-2xl bg-gradient-to-t from-[#0B4F3C] to-emerald-500`} />
                </div>
              )
            })}
          </div>

          <div className="mt-8 space-y-2">
            {rest.map((row, i) => (
              <div
                key={row.name}
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  row.isYou ? 'border-[#F5A623] bg-[#FFF8EB]' : 'border-emerald-100 bg-white'
                }`}
              >
                <span className="w-7 text-center text-sm font-black text-emerald-800">{i + 4}</span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-sm font-black text-emerald-900">
                  {row.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#10261e]">
                    {row.name} {row.isYou ? '· сен' : ''}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {(row as { city?: string }).city || ''} · {row.score} ұпай
                    {(row as { badge?: string }).badge ? ` · ${(row as { badge?: string }).badge}` : ''}
                  </p>
                </div>
                <Flame days={row.streak} />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return null
}


function SettingsPanel({
  open,
  onClose,
  theme,
  fontScale,
  apiKey,
  user,
  onTheme,
  onFont,
  onApiKey,
  onAuth,
}: {
  open: boolean
  onClose: () => void
  theme: ThemeMode
  fontScale: FontScale
  apiKey: string
  user: AppUserView | null
  onTheme: (t: ThemeMode) => void
  onFont: (f: FontScale) => void
  onApiKey: (k: string) => void
  onAuth: () => void
}) {
  const [localKey, setLocalKey] = useState(apiKey)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalKey(apiKey)
  }, [apiKey, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black text-emerald-950">Баптау</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <Icon name="close" size={18} />
          </button>
        </div>

        <section className="mt-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Режим</p>
          <div className="mt-2 flex gap-2">
            {(['light', 'dark'] as ThemeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => onTheme(m)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold ${
                  theme === m ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                }`}
              >
                {m === 'light' ? 'Ақ' : 'Қара'}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Қаріп өлшемі</p>
          <div className="mt-2 flex gap-2">
            {([
              ['sm', 'Кіші'],
              ['md', 'Орта'],
              ['lg', 'Үлкен'],
            ] as [FontScale, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => onFont(id)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold ${
                  fontScale === id ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Аккаунт</p>
          {user ? (
            <p className="mt-2 text-sm font-bold text-emerald-950">
              {user.name} {user.email ? `· ${user.email}` : ''}
            </p>
          ) : (
            <button
              onClick={onAuth}
              className="mt-2 flex items-center gap-2 text-sm font-bold text-emerald-800"
            >
              <Icon name="google" size={16} /> Google-мен кіру
            </button>
          )}
        </section>

        <section className="mt-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
            Gemini API кілті (ИИ тексеру)
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Кілт браузерде сақталады. Google AI Studio-дан алыңыз. Оқушы жауабын тексеру үшін қажет.
          </p>
          <input
            type="password"
            value={localKey}
            onChange={(e) => {
              setLocalKey(e.target.value)
              setSaved(false)
            }}
            placeholder="AIza..."
            className="mt-3 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            onClick={() => {
              setStoredApiKey(localKey.trim())
              onApiKey(localKey.trim())
              setSaved(true)
            }}
            className="mt-3 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-800"
          >
            {saved ? 'Сақталды ✓' : 'Кілтті сақтау'}
          </button>
        </section>
      </div>
    </div>
  )
}

function TestScreen({ role, onBack }: { role: Role; onBack: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    testQuestions.map(() => null),
  )
  const [submitted, setSubmitted] = useState(false)
  const score = submitted
    ? answers.reduce<number>((a, v, i) => a + (v === testQuestions[i].answer ? 1 : 0), 0)
    : 0

  return (
    <div className="min-h-screen bg-[#f7f6f1]">
      <header className="border-b border-emerald-900/10">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <Icon name="arrow" size={16} className="rotate-180" /> Артқа
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <h1 className="font-display text-2xl font-black text-emerald-950">Қорытынды тест</h1>
        {testQuestions.map((q, qi) => (
          <div key={qi} className="rounded-2xl border border-emerald-100 bg-white p-5">
            <p className="text-sm font-bold text-emerald-950">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                const sel = answers[qi] === oi
                const ok = submitted && oi === q.answer
                const bad = submitted && sel && oi !== q.answer
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() =>
                      setAnswers((p) => p.map((v, i) => (i === qi ? oi : v)))
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm ${
                      ok
                        ? 'border-emerald-400 bg-emerald-50'
                        : bad
                          ? 'border-red-300 bg-red-50'
                          : sel
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200'
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[10px] font-black">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={answers.some((a) => a === null)}
            className="primary-button w-full justify-center disabled:opacity-40"
          >
            Нәтижені көру
          </button>
        ) : (
          <div className="rounded-2xl bg-emerald-800 p-6 text-center text-white">
            <p className="text-sm opacity-80">Нәтиже</p>
            <p className="mt-1 font-display text-4xl font-black">
              {score}/{testQuestions.length}
            </p>
            <button
              onClick={() => {
                setAnswers(testQuestions.map(() => null))
                setSubmitted(false)
              }}
              className="mt-4 rounded-xl bg-white/20 px-4 py-2 text-sm font-bold"
            >
              Қайта тапсыру
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function SelfScreen({ role, onBack }: { role: Role; onBack: () => void }) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const max = selfAssessmentRubric.length * 4
  const pct = max ? Math.round((total / max) * 100) : 0

  return (
    <div className="min-h-screen bg-[#f7f6f1]">
      <header className="border-b border-emerald-900/10">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <Icon name="arrow" size={16} className="rotate-180" /> Артқа
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <h1 className="font-display text-2xl font-black text-emerald-950">Өзін-өзі бағалау</h1>
        {selfAssessmentRubric.map((r) => (
          <div key={r.id} className="rounded-2xl border border-emerald-100 bg-white p-5">
            <h3 className="font-display text-lg font-black">{r.title}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {r.levels.map((lv) => (
                <button
                  key={lv.score}
                  onClick={() => setScores((s) => ({ ...s, [r.id]: lv.score }))}
                  className={`rounded-xl border p-3 text-left text-xs ${
                    scores[r.id] === lv.score
                      ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100'
                      : 'border-slate-100'
                  }`}
                >
                  <span className="font-extrabold text-emerald-700">
                    {lv.score} · {lv.label}
                  </span>
                  <p className="mt-1 text-slate-500">{lv.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(scores).length === selfAssessmentRubric.length && (
          <div className="rounded-2xl bg-emerald-800 p-6 text-white">
            <p className="text-sm opacity-80">Жалпы</p>
            <p className="font-display text-3xl font-black">
              {total}/{max} · {pct}%
            </p>
          </div>
        )}
      </main>
    </div>
  )
}


function Label({ children, tone = 'emerald' }: { children: React.ReactNode; tone?: 'emerald' | 'indigo' }) {
  return (
    <p className={`text-xs font-extrabold uppercase tracking-wider ${tone === 'indigo' ? 'text-indigo-700' : 'text-emerald-700'}`}>
      {children}
    </p>
  )
}

function lessonImages(l: Lesson): string[] {
  if (l.explainImages?.length) return l.explainImages
  return l.images?.length ? l.images : l.imageUrl ? [l.imageUrl] : []
}

function LessonMedia({ lesson, big = false, compact = false }: { lesson: Lesson; big?: boolean; compact?: boolean }) {
  const imgs = lessonImages(lesson)
  if (!imgs.length && !lesson.videoUrl) return null
  return (
    <div className={`${compact ? '' : 'mt-6 '}space-y-4`}>
      {imgs.length > 0 && (
        <div className={`grid gap-4 ${imgs.length > 1 && !compact ? 'sm:grid-cols-2' : ''}`}>
          {imgs.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`w-full rounded-2xl border border-emerald-100 bg-white object-contain ${big ? 'max-h-[60vh]' : 'max-h-72'}`}
            />
          ))}
        </div>
      )}
      {lesson.videoUrl && (
        <div className="aspect-video overflow-hidden rounded-2xl border border-emerald-100">
          <iframe
            src={lesson.videoUrl}
            title="Видео"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}

type Block = { label: string; node: React.ReactNode; skipInDeck?: boolean }

function chunkText(content?: string): string[] {
  const paras = (content ?? '').split(/\n\n+/).filter(Boolean)
  const size = Math.max(1, Math.ceil(paras.length / 3))
  const out: string[] = []
  for (let k = 0; k < paras.length; k += size) out.push(paras.slice(k, k + size).join('\n\n'))
  return out
}

function LessonQuiz({ quiz }: { quiz: NonNullable<Lesson['quiz']> }) {
  const [sel, setSel] = useState<number[]>([])
  const [sent, setSent] = useState(false)
  const score = quiz.filter((q, i) => sel[i] === q.answer).length
  return (
    <div className="mt-4 space-y-6">
      {quiz.map((q, i) => (
        <div key={q.question}>
          <p className="text-base font-bold leading-7 text-[#10261e]">{i + 1}. {q.question}</p>
          <div className="mt-2 space-y-2">
            {q.options.map((o, j) => {
              const picked = sel[i] === j
              const tone = sent
                ? j === q.answer ? 'border-emerald-500 bg-emerald-50' : picked ? 'border-red-300 bg-red-50' : 'border-emerald-100 bg-white'
                : picked ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-white hover:bg-emerald-50/50'
              return (
                <button key={o} type="button" disabled={sent} onClick={() => setSel((v) => { const n = [...v]; n[i] = j; return n })} className={`block w-full rounded-xl border px-4 py-2.5 text-left text-sm text-slate-700 ${tone}`}>
                  {o}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {!sent ? (
        <button type="button" disabled={sel.filter((v) => v !== undefined).length < quiz.length} onClick={() => setSent(true)} className="rounded-xl bg-[#0B4F3C] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50">
          Тестті тексеру
        </button>
      ) : (
        <p className="text-lg font-black text-emerald-900">Нәтиже: {score} / {quiz.length}</p>
      )}
    </div>
  )
}

function LessonDeck({ lesson, isTeacher, pages, onClose }: { lesson: Lesson; isTeacher: boolean; pages: Block[]; onClose: () => void }) {
  const [i, setI] = useState(0)
  const all: Block[] = [
    {
      label: 'Тақырып',
      node: (
        <div>
          <Label>{lesson.sectionTitle} · Сабақ {lesson.number} · {lesson.duration}</Label>
          <h1 className="mt-3 font-display text-4xl font-black text-[#10261e] sm:text-5xl">{lesson.title}</h1>
          <div className="mt-8 rounded-2xl bg-emerald-50 p-6">
            <Label>Сабақ мақсаты</Label>
            <p className="mt-3 text-xl leading-9 text-slate-800">{lesson.goal}</p>
          </div>
          {!isTeacher && lesson.question && (
            <p className="mt-6 text-2xl font-black leading-snug text-[#10261e]">{lesson.question}</p>
          )}
        </div>
      ),
    },
    ...pages.filter((b) => !b.skipInDeck),
  ]
  const last = all.length - 1
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') setI((v) => Math.min(last, v + 1))
      else if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [last, onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8F6F1]">
      <div className="flex items-center justify-between border-b border-emerald-900/10 px-4 py-3">
        <p className="truncate text-sm font-extrabold text-emerald-800">{lesson.title}</p>
        <button type="button" onClick={onClose} className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm font-bold text-emerald-900">✕ Жабу</button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-5xl [&_.text-sm]:!text-base sm:[&_.text-sm]:!text-lg">{all[i].node}</div>
      </div>
      <div className="flex items-center justify-between border-t border-emerald-900/10 px-4 py-3">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-900 disabled:opacity-40">← Алдыңғы</button>
        <p className="text-xs font-bold text-[#4A5D54]">{all[i].label} · {i + 1} / {all.length}</p>
        <button type="button" disabled={i === last} onClick={() => setI(i + 1)} className="rounded-xl bg-[#0B4F3C] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">Келесі →</button>
      </div>
    </div>
  )
}


// ——— Жұмыс парағы көмекшілері ———

function itemsOf(t: LessonTask): string[] {
  return t.items?.length ? t.items : ['']
}

/** Тапсырмалар құрылымдалған болса — соны, әйтпесе жұмыс парағы мәтінінен «N-тапсырма» бойынша бөледі. */
function lessonTasks(l: Lesson): LessonTask[] {
  if (l.tasks?.length) return l.tasks
  const ws = (l.worksheet ?? '').trim()
  if (ws) {
    const found = ws
      .split(/\n(?=\s*\d+-тапсырма)/)
      .map((x) => x.trim())
      .filter((x) => /^\d+-тапсырма/.test(x))
    if (found.length)
      return found.map((x) => {
        const [first, ...rest] = x.split('\n')
        return { title: first.replace(/^\d+-тапсырма\.?\s*/, '').trim() || 'Тапсырма', context: rest.join('\n').trim() }
      })
    return [{ title: l.worksheetTitle ?? 'Жұмыс парағы', context: ws }]
  }
  const body = [l.situation, l.caseTask].filter(Boolean).join('\n\n')
  return [{ title: 'Орында · жаз', context: body }]
}

/** **қалың** белгісін <strong> етіп көрсетеді. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <strong key={i} className="font-extrabold text-[#10261e]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function SimpleTable({ table }: { table: { headers: string[]; rows: string[][] } }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-emerald-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-emerald-50 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
          <tr>
            {table.headers.map((h) => (
              <th key={h} className="px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-100 bg-white">
          {table.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="px-4 py-2.5 leading-6 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TaskPage({
  index,
  task,
  worksheetTitle,
  worksheetGoal,
  printUrl,
  single,
  getAns,
  setAns,
}: {
  index: number
  task: LessonTask
  worksheetTitle?: string
  worksheetGoal?: string
  printUrl?: string
  single: boolean
  getAns: (t: number, i: number) => string
  setAns: (t: number, i: number, v: string) => void
}) {
  const hasItems = !!task.items?.length
  const title = task.title.replace(/^\s*\d+-тапсырма\.?\s*/i, '')
  const field = 'w-full rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{worksheetTitle ? `Жұмыс парағы · ${worksheetTitle}` : 'Жұмыс парағы'}</Label>
        {printUrl && (
          <a href={printUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 hover:underline">
            Баспаға арналған нұсқа ↗
          </a>
        )}
      </div>
      {worksheetGoal && (
        <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-7 text-slate-700">
          <span className="font-extrabold text-emerald-800">Сабақ мақсаты: </span>
          {worksheetGoal}
        </p>
      )}
      <h2 className="mt-4 font-display text-2xl font-black text-[#10261e]">{single ? title : `${index + 1}-тапсырма. ${title}`}</h2>

      {task.terms && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <span className="font-extrabold text-[#10261e]">Терминдер:</span>
          {task.terms.map((term) => (
            <span key={term} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">
              {term}
            </span>
          ))}
        </p>
      )}
      {task.instruction && (
        <p className="mt-3 text-base leading-8 text-slate-700">
          <Rich text={task.instruction} />
        </p>
      )}
      {task.context && (
        <div className="mt-3 whitespace-pre-line text-base leading-8 text-slate-700">
          <Rich text={task.context} />
        </div>
      )}
      {task.table && <SimpleTable table={task.table} />}

      {hasItems ? (
        <ol className="mt-6 space-y-5">
          {itemsOf(task).map((q, i) => (
            <li key={i}>
              <p className="text-sm font-semibold leading-7 text-[#10261e]">
                <span className="mr-1.5 font-extrabold text-emerald-700">{i + 1}.</span>
                <Rich text={q} />
              </p>
              {task.short ? (
                <input
                  type="text"
                  value={getAns(index, i)}
                  onChange={(e) => setAns(index, i, e.target.value)}
                  className={`mt-2 ${field}`}
                  placeholder="Жауабың..."
                />
              ) : (
                <textarea
                  value={getAns(index, i)}
                  onChange={(e) => setAns(index, i, e.target.value)}
                  rows={3}
                  className={`mt-2 resize-none ${field}`}
                  placeholder="Жауабыңды осында жаз..."
                />
              )}
            </li>
          ))}
        </ol>
      ) : (
        <textarea
          value={getAns(index, 0)}
          onChange={(e) => setAns(index, 0, e.target.value)}
          rows={8}
          className={`mt-6 resize-none ${field}`}
          placeholder="Жауабыңды осында жаз..."
        />
      )}

      {(task.rubric || task.points) && (
        <p className="mt-6 text-xs font-bold leading-6 text-emerald-800">
          Бағалау: {task.rubric}
          {task.points ? ` · ${task.points} ұпай` : ''}
        </p>
      )}
    </div>
  )
}
