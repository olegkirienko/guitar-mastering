import { ArrowRight, Lock01 } from '@untitledui/icons';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/data/lessons';
import { cx } from '@/lib/cx';

interface LessonCardProps {
  lesson: Lesson;
}

export function LessonCard({ lesson }: LessonCardProps) {
  const available = lesson.status === 'available';

  const content = (
    <article
      className={cx(
        'group flex min-h-44 gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-xs transition',
        available
          ? 'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md'
          : 'opacity-60',
      )}
    >
      <div className="text-sm font-semibold text-gray-400">{lesson.number}</div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
          {available ? 'Доступний' : 'Далі'}
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-gray-950">{lesson.title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">{lesson.description}</p>

        {available ? (
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            Відкрити урок
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : (
          <span className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500">
            <Lock01 className="size-4" />
            Після попередніх уроків
          </span>
        )}
      </div>
    </article>
  );

  return available ? <Link to="/lessons/01">{content}</Link> : content;
}
