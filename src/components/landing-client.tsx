'use client'

import type { AppUserView } from '@/lib/app-auth'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AuthDialog } from './auth-dialog'
import { Icon } from './edu-icons'

export function LandingClient() {
  const [authOpen, setAuthOpen] = useState(false)
  const [user, setUser] = useState<AppUserView | null>(null)

  useEffect(() => {
    fetch('/api/app-session')
      .then((response) => response.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => undefined)
  }, [])

  const authenticated = useCallback((nextUser: AppUserView) => {
    setUser(nextUser)
    setAuthOpen(false)
  }, [])

  return (
    <main className="overflow-hidden bg-[#f4faf6] text-[#1a2e22]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-[0_10px_25px_rgba(22,163,74,.32)]">
              <Icon name="leaf" size={22} />
            </span>
            <span>
              <strong className="font-display block text-lg font-black leading-none text-emerald-900">
                BioQuest
              </strong>
              <small className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.18em] text-emerald-600/70">
                Биотехнология және генетика
              </small>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-500 md:flex">
            <a href="#about" className="transition hover:text-emerald-600">
              Платформа туралы
            </a>
            <a href="#program" className="transition hover:text-emerald-600">
              Бағдарлама
            </a>
            <a href="#roles" className="transition hover:text-emerald-600">
              Кімге арналған?
            </a>
            <a href="#contact" className="transition hover:text-emerald-600">
              Байланыс
            </a>
          </nav>
          {user ? (
            <Link
              href="/platform"
              className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-bold shadow-sm"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                {user.name.charAt(0)}
              </span>
              <span className="hidden sm:inline">{user.name}</span>
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300"
            >
              Кіру
            </button>
          )}
        </div>
      </header>

      <section className="relative bg-gradient-to-b from-emerald-50 to-[#f4faf6] px-5 pb-20 pt-32 sm:px-8 sm:pt-40">
        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="absolute -right-24 top-16 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -left-32 bottom-10 h-80 w-80 rounded-full bg-teal-100/50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-extrabold text-emerald-700 shadow-sm backdrop-blur">
              <Icon name="leaf" size={16} /> BioQuest
            </div>
            <h1 className="mx-auto mt-7 max-w-3xl font-hero-serif text-[36px] font-bold leading-[1.15] tracking-[-.01em] text-emerald-950 sm:text-5xl lg:text-[52px]">
              Биотехнология және генетика негіздерін мәселеге бейімдеп оқыту
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Мұғалімдер мен оқушыларға арналған біртұтас цифрлық жүйе
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/platform"
                className="primary-button justify-center px-6 py-4"
              >
                Тегін бастау <Icon name="arrow" size={19} />
              </Link>
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center justify-center gap-3 rounded-xl border border-emerald-100 bg-white px-6 py-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon name="mail" size={15} />
                </span>{' '}
                Gmail-мен тіркелу
              </button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-emerald-500" /> Тегін қолжетімділік
              </span>
            </div>
          </div>

        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="relative overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(6,78,59,.25)] ring-1 ring-emerald-900/10">
            <img src="/landing/dna-hand.jpg" alt="ДНҚ молекуласы" className="h-64 w-full object-cover sm:h-[26rem]" />
          </div>
          <img
            src="/landing/dna-cutout.png"
            alt=""
            className="pointer-events-none absolute -right-3 -top-12 hidden h-44 w-44 rotate-12 drop-shadow-2xl sm:block lg:-right-12 lg:h-64 lg:w-64"
          />
          <div className="absolute -bottom-5 right-6 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-left shadow-lg backdrop-blur sm:right-10">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">ИИ бағалау</p>
            <p className="font-display text-lg font-black text-emerald-950">0–10 балл</p>
          </div>
          <div className="absolute -bottom-5 left-6 hidden rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-left shadow-lg backdrop-blur sm:block sm:left-10">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Бағдарлама</p>
            <p className="font-display text-lg font-black text-emerald-950">5 бөлім · 34 сабақ</p>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="section-kicker">Платформа туралы</p>
              <h2 className="section-heading">BioQuest – биотехнология және генетика негіздерін оқытуға арналған білім беру платформасы</h2>
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-lg font-semibold leading-9 text-emerald-950">
              BioQuest – биотехнология және генетика негіздерін проблемалық оқыту әдісі арқылы меңгертуге бағытталған заманауи цифрлық білім беру платформасы.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[
                ['Платформа', 'Платформа оқушылар мен мұғалімдерге арналған. Оның басты ерекшелігі – теориялық білімді дайын күйінде ұсынумен шектелмей, оқушыларды нақты өмірлік жағдаяттар мен ғылыми мәселелерді талдауға, зерттеуге және олардың шешімін табуға бағыттауы.'],
                ['Оқушыларға', 'Оқушылар үшін платформа генетика мен биотехнологияның күрделі ұғымдарын түсінікті түрде меңгеруге, проблемалық тапсырмаларды орындауға, ғылыми болжам жасауға, логикалық және сыни ойлау дағдыларын дамытуға мүмкіндік береді.'],
                ['Мұғалімдерге', 'Мұғалімдер үшін платформа сабақ барысында проблемалық жағдаяттарды қолдануға, оқушылардың зерттеушілік қабілеттерін дамытуға, оқу материалдарын тиімді ұйымдастыруға және білімді тәжірибемен байланыстыруға көмектеседі.'],
                ['Мақсаты', 'Платформаның негізгі мақсаты – оқушылардың биотехнология және генетика саласындағы ғылыми сауаттылығын арттыру, проблемаларды өздігінен талдау және дәлелді шешім қабылдау дағдыларын қалыптастыру.'],
              ].map(([tag, copy]) => (
                <article key={tag} className="feature-card">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">{tag}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
            <blockquote className="mt-10 rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-950 p-8 text-center font-hero-serif text-xl font-bold leading-snug text-white shadow-[0_24px_60px_rgba(6,78,59,.25)] sm:p-10 sm:text-3xl">
              BioQuest – дайын жауапты жаттау емес, мәселені зерттеу арқылы білім алу!
            </blockquote>
          </div>
        </div>
      </section>

      <section id="program" className="bg-[#f0f7f2] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="section-kicker">Оқу бағдарламасы</p>
              <h2 className="section-heading text-left">5 бөлім. 34 сабақ.</h2>
            </div>
            <Link
              href="/platform"
              className="flex items-center gap-2 text-sm font-extrabold text-emerald-600"
            >
              Барлық сабақты ашу <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              [
                '01',
                'Генетика негіздері',
                'Мендель заңдары, генотип және фенотип',
                '4 сабақ',
                '#16a34a',
              ],
              [
                '02',
                'Молекулалық генетика',
                'ДНҚ, репликация және ген экспрессиясы',
                '2 сабақ',
                '#0d9488',
              ],
              [
                '03',
                'Биотехнология',
                'Гендік инженерия, клондау, CRISPR',
                '2 сабақ',
                '#65a30d',
              ],
            ].map(([number, title, copy, count, color]) => (
              <article
                key={title}
                className="group rounded-[24px] border border-emerald-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-black" style={{ color }}>
                    {number}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-emerald-700">
                    {count}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-xl font-black text-emerald-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p>
                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-emerald-50">
                  <i
                    className="block h-full w-1/3 rounded-full transition-all group-hover:w-2/3"
                    style={{ background: color }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-white px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-600 to-green-800 p-8 text-white sm:p-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border-[40px] border-white/[.06]" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
              <Icon name="user" size={24} />
            </span>
            <h2 className="mt-8 font-display text-2xl font-black sm:text-3xl">Өз бетімен үйренемін</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/80">
              Түсіндірмені оқы, иллюстрацияны қара, тапсырманы орында және өз біліміңді бағала. Әр
              сабақ өз қарқыныңмен өтуге ыңғайлы. Күнделікті кіріп, «от» жина.
            </p>
          </article>
          <article className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-[#f0f7f2] p-8 sm:p-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-100/60" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Icon name="users" size={24} />
            </span>
            <h2 className="mt-8 font-display text-2xl font-black sm:text-3xl text-emerald-950">Сабақта қолданамын</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
              Сабақ жоспары, әдістемелік нұсқаулар және оқушылардың прогресін бақылау құралдары.
              Материалдарды сыныпта немесе қашықтан қолданыңыз.
            </p>
          </article>
        </div>
      </section>

      {/* Contact section */}
      <section id="contact" className="bg-gradient-to-b from-emerald-50 to-white px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-kicker">Бізбен байланысыңыз</p>
          <h2 className="section-heading">Өтініштер немесе қажеттіліктер бар ма?</h2>
          <p className="section-copy mx-auto max-w-xl">
            Сұрақтарыңыз, ұсыныстарыңыз немесе платформаны жақсарту туралы ойларыңыз болса — бізге
            хабарласыңыз. Біз сізді тыңдаймыз.
          </p>
          <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <a
              href="tel:+77056641130"
              className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-white px-8 py-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Icon name="phone" size={26} />
              </span>
              <div className="text-left">
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                  Телефон
                </p>
                <p className="mt-1 font-display text-2xl font-black text-emerald-950">
                  8705 664 1130
                </p>
              </div>
            </a>
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-4 text-sm text-slate-600">
              <p className="font-bold text-emerald-800">Жұмыс уақыты</p>
              <p className="mt-1">Дүйсенбі – Жұма · 09:00 – 18:00</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-100 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
              <Icon name="leaf" size={18} />
            </span>
            <span className="font-display text-sm font-black text-emerald-900">BioQuest</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 BioQuest · Биотехнология және генетика</p>
        </div>
      </footer>

      {authOpen && (
        <AuthDialog onClose={() => setAuthOpen(false)} onAuthenticated={authenticated} />
      )}
    </main>
  )
}
