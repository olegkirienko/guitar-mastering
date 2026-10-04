import type { LessonShellProps } from '@/components/lesson/lesson-shell/types';
import { LessonStepList } from '@/components/lesson/lesson-step-list/lesson-step-list';
import { cx } from '@/utils/cx';
import { ArrowLeft, ChevronDown } from '@untitledui/icons';
import { Link } from 'react-router';

export function LessonShell({ stageLabel, title, estimatedTime, progressStops, currentStop, steps, currentStepId, children }: LessonShellProps) {
  const visibleStop = Math.min(Math.max(currentStop, 1), progressStops.length);
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
    <Link to="/course" className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-tertiary outline-focus-ring transition duration-100 ease-linear hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"><ArrowLeft className="size-4" />Усі уроки</Link>
    <div className="mt-9 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label="Кроки уроку" className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-secondary bg-secondary p-3"><LessonStepList steps={steps} currentStepId={currentStepId} label="Кроки уроку" /></div>
      </nav>
      <div className="min-w-0 max-w-4xl">
        <header className="border-b border-secondary pb-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-brand-secondary"><span>{stageLabel}</span><span className="text-fg-quaternary">·</span><span className="text-quaternary">{estimatedTime}</span></div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-primary sm:text-5xl">{title}</h1>
          <div className="mt-7" aria-label={`Прогрес: крок ${visibleStop} із ${progressStops.length}`}>
            <div className="flex justify-between text-sm text-tertiary"><span>Крок {visibleStop} із {progressStops.length}</span><span className="hidden sm:inline">{progressStops[visibleStop - 1]}</span></div>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">{progressStops.map((stop, index) => <span key={stop} className={cx('h-1.5 flex-1 rounded-full bg-quaternary', index < visibleStop && 'bg-brand-solid')} />)}</div>
          </div>
        </header>
        <details className="group mt-6 rounded-xl border border-secondary bg-secondary lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-semibold text-secondary">
            <span>Кроки уроку · {currentIndex + 1} із {steps.length}</span>
            <ChevronDown className="size-4 transition duration-100 ease-linear group-open:rotate-180" aria-hidden="true" />
          </summary>
          <nav aria-label="Кроки уроку" className="border-t border-secondary p-2"><LessonStepList steps={steps} currentStepId={currentStepId} label="Кроки уроку" /></nav>
        </details>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  </main>;
}
