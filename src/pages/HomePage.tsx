import { ArrowRight, BookOpen01 } from '@untitledui/icons';
import { Link } from 'react-router-dom';
import { lessons } from '@/data/lessons';
import { LessonCard } from '@/components/LessonCard';
import { SectionHeading } from '@/components/SectionHeading';

export function HomePage() {
  return (
    <main>
      <section className="border-b border-gray-200 bg-gradient-to-b from-brand-25 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-xs">
              <BookOpen01 className="size-4" />
              Навчальний курс
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.04em] text-gray-950 sm:text-6xl">
              Музика → звук → ноти → гітара
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Починаємо з найпростішого й поступово будуємо цілісне розуміння того,
              як працює музика та класична шестиструнна гітара.
            </p>
            <Link
              to="/lessons/01"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-700"
            >
              Почати урок 1
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Roadmap"
          title="Шлях курсу"
          description="Нові модулі відкриватимемо після вашого фідбеку. Не просто проходимо матеріал — будуємо розуміння."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </section>
    </main>
  );
}
