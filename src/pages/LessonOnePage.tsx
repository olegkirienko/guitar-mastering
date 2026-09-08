import { ArrowLeft, ArrowRight, CheckCircle, HelpCircle, Lightbulb01 } from '@untitledui/icons';
import { Link } from 'react-router-dom';

function Block({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8 ${className}`}>{children}</section>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{children}</p>;
}

export function LessonOnePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-950">
          <ArrowLeft className="size-4" />
          Усі уроки
        </Link>

        <p className="mt-10 text-xs font-semibold uppercase tracking-wider text-gray-500">Урок 01 · Фундамент</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-gray-950 sm:text-5xl">
          Що таке музика?
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
          Сьогодні ми ще майже не граємо. Наша задача — зрозуміти явище,
          на якому побудована вся музика: <strong>звук</strong>.
        </p>
      </div>

      <div className="space-y-5">
        <Block className="border-l-4 border-l-brand-600">
          <Label>🎲 Раунд 1 — без підглядання</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Як би ти пояснив, що таке музика?</h2>
          <p className="mt-3 text-gray-600">
            По черзі дайте відповідь один одному. Не шукайте «правильне» визначення.
            Спробуйте пояснити своїми словами.
          </p>
          <div className="mt-6 space-y-3">
            {[
              'Що відрізняє музику від просто шуму?',
              'Чи може музика існувати без звуку?',
              'Чому одна нота звучить вище, а інша нижче?',
            ].map((q, i) => (
              <div key={q} className="rounded-lg border border-gray-200 px-4 py-3 text-sm">
                <strong>{i + 1}.</strong> {q}
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3 rounded-lg bg-brand-25 p-4 text-sm text-brand-900">
            <Lightbulb01 className="mt-0.5 size-5 shrink-0" />
            Спочатку відповідайте інтуїтивно. Повернемося до цих питань наприкінці.
          </div>
        </Block>

        <Block>
          <Label>🔬 Теорія</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">1. Звук — це коливання</h2>
          <p className="mt-4 leading-7 text-gray-700">
            Уявімо струну гітари. Коли ми її смикаємо, вона починає дуже швидко рухатися
            вперед-назад. Це називається <strong>коливанням</strong>.
          </p>
          <p className="mt-3 leading-7 text-gray-700">
            Струна передає ці коливання навколишньому повітрю. У повітрі виникають
            зміни тиску, які поширюються назовні як <strong>звукова хвиля</strong>.
            Коли хвиля доходить до вуха, барабанна перетинка теж починає коливатися,
            а мозок сприймає це як звук.
          </p>

          <div className="mt-7 grid gap-2 sm:grid-cols-7 sm:items-center">
            {['🎸 струна', '→', '🌊 хвиля', '→', '👂 вухо', '→', '🧠 мозок'].map((item, i) => (
              <div key={i} className={`text-center ${i % 2 ? 'hidden text-gray-400 sm:block' : 'rounded-lg bg-gray-50 p-3 text-sm'}`}>
                {item}
              </div>
            ))}
          </div>
        </Block>

        <Block>
          <Label>📐 Ключове поняття</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">2. Частота — скільки коливань за секунду</h2>
          <p className="mt-4 leading-7 text-gray-700">
            <strong>Частота</strong> показує, скільки повних коливань відбувається за одну секунду.
            Її вимірюють у герцах (Гц).
          </p>
          <div className="my-6 rounded-lg border border-dashed border-brand-300 bg-brand-25 p-5 text-center">
            <span className="text-sm text-gray-600">частота = кількість коливань</span>
            <strong className="block text-xl text-brand-700">за 1 секунду</strong>
          </div>
          <p className="leading-7 text-gray-700">
            Наприклад, <strong>440 Гц</strong> означає 440 повних коливань за секунду.
            Нота з більшою частотою сприймається як <strong>вища</strong>, а з меншою — як <strong>нижча</strong>.
          </p>
        </Block>

        <Block>
          <Label>🎸 Експеримент</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">3. Перевіримо це на гітарі</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-gray-700">
            <li>Візьміть будь-яку струну та смикніть її, не притискаючи до грифа.</li>
            <li>Послухайте висоту звуку.</li>
            <li>Тепер притисніть струну на якомусь ладі й смикніть її знову.</li>
            <li>Порівняйте два звуки.</li>
          </ol>
          <div className="mt-6 rounded-lg bg-gray-50 p-5 text-sm leading-6 text-gray-700">
            <strong>Питання для двох:</strong> чому після притискання струна звучить вище?
            Що саме змінилося — матеріал струни, її товщина чи довжина частини струни, що коливається?
          </div>
        </Block>

        <Block>
          <Label>🧩 Раунд 2 — перевіряємо себе</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Повернімося до початкових питань</h2>
          <div className="mt-6 space-y-3">
            {[
              ['Чому коротша струна зазвичай звучить вище?', 'Коротша частина струни коливається з вищою основною частотою.'],
              ['Що таке частота?', 'Кількість повних коливань за одну секунду. Одиниця — герц (Гц).'],
              ['Чи потрібне повітря для поширення звуку?', 'Потрібне матеріальне середовище. У вакуумі звукова хвиля не поширюється.'],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-lg border border-gray-200 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-3 font-semibold">
                  <HelpCircle className="size-5 text-brand-600" />
                  {q}
                </summary>
                <p className="mt-3 pl-8 text-sm leading-6 text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </Block>

        <Block className="bg-gray-50">
          <Label>🏠 Міні-дослідження</Label>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Завдання до наступного разу</h2>
          <p className="mt-4 text-gray-700">Спробуйте разом відповісти своїми словами:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
            <li>Що таке звук?</li>
            <li>Що таке частота?</li>
            <li>Чому притискання струни до ладу змінює висоту звуку?</li>
          </ul>
          <p className="mt-5 flex gap-3 text-sm text-gray-600">
            <CheckCircle className="size-5 shrink-0 text-success-600" />
            Не потрібно вчити визначення напам'ять. Важливо зрозуміти причинно-наслідковий зв'язок.
          </p>
        </Block>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-950">
          <ArrowLeft className="size-4" />
          До roadmap
        </Link>
        <span className="text-sm text-gray-500">Наступний урок відкриємо після вашого фідбеку.</span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400">
          Далі
          <ArrowRight className="size-4" />
        </span>
      </div>
    </main>
  );
}
