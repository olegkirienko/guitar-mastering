import { ArrowRight, Check } from '@untitledui/icons';
import { Link } from 'react-router';
import { Badge } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { SectionHeading } from '@/components/section-heading/section-heading';
import { courseStages, learningModes, requirements } from '@/pages/home-page/constants';
import { useHomePage } from '@/pages/home-page/hooks/use-home-page';
import { courseLessons } from '@/progress/course/constants';

const section = 'mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20';

export function HomePage() {
  const { courseHref } = useHomePage();
  return (
    <main>
      <section className="border-b border-secondary bg-gradient-to-b from-bg-brand-primary_alt to-bg-primary">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-brand-secondary">Інтерактивний курс класичної гітари</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance text-primary sm:text-6xl">
              Від першого звуку до власної гри
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-tertiary">
              Починаємо з найпростішого — що таке звук — і крок за кроком будуємо цілісне розуміння того,
              як працює музика та класична шестиструнна гітара.
            </p>
            <Button href={courseHref} size="xl" className="mt-8" iconTrailing={ArrowRight}>
              Перейти до курсу
            </Button>
          </div>
        </div>
      </section>

      <section className={section} aria-labelledby="how-title">
        <SectionHeading id="how-title" eyebrow="Підхід" title="Як ти вчишся" description="Кожен урок поєднує розуміння, слух, руки й дослід. Без довгих лекцій." />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {learningModes.map(({ icon: Icon, title, description }) => (
            <li key={title} className="rounded-2xl border border-secondary bg-secondary p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-primary text-fg-brand-primary">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-md leading-7 text-tertiary">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-secondary bg-secondary" aria-labelledby="path-title">
        <div className={section}>
          <SectionHeading id="path-title" eyebrow="Шлях курсу" title="Вісім етапів — від звуку до музики" description="Нові уроки відкриваються послідовно. Наступний етап з’являється, коли готовий попередній." />
          <ol className="mt-10 grid items-start gap-3 md:grid-cols-2">
            {courseStages.map((stage) => {
              const lessons = courseLessons.filter((lesson) => lesson.lessonId.startsWith(`stage-${String(stage.number).padStart(2, '0')}-`));
              return (
                <li key={stage.number} className="rounded-xl border border-secondary bg-primary p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex gap-3 text-lg font-semibold text-primary">
                      <span className="font-display text-quaternary" aria-hidden="true">{String(stage.number).padStart(2, '0')}</span>
                      <span><span className="sr-only">Етап {stage.number}: </span>{stage.title}</span>
                    </h3>
                    <Badge type="pill-color" color={lessons.length > 0 ? 'brand' : 'gray'} size="sm">
                      {lessons.length > 0 ? 'Доступно' : 'Згодом'}
                    </Badge>
                  </div>
                  {lessons.length > 0 && (
                    <ul className="mt-3 space-y-1 pl-9">
                      {lessons.map((lesson) => (
                        <li key={lesson.lessonId}>
                          <Link to={`/lessons/${lesson.routeId}`} className="inline-flex min-h-11 items-center gap-2 rounded-md text-md font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2">
                            {lesson.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className={section} aria-labelledby="needs-title">
        <SectionHeading id="needs-title" eyebrow="Що потрібно" title="Мінімум, щоб почати" />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {requirements.map((item) => (
            <li key={item.title} className="flex gap-3">
              <Check className="mt-1 size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-primary">{item.title}</h3>
                <p className="mt-1 text-md leading-7 text-tertiary">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-brand-section px-6 py-14 text-center sm:px-12">
          <h2 className="font-display text-3xl font-semibold text-balance text-primary_on-brand sm:text-4xl">Почни з першого звуку</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-secondary_on-brand">Перший урок займає кілька хвилин і не потребує жодної підготовки.</p>
          <Button href={courseHref} size="xl" color="secondary" className="mt-8" iconTrailing={ArrowRight}>
            Перейти до курсу
          </Button>
        </div>
      </section>
    </main>
  );
}
