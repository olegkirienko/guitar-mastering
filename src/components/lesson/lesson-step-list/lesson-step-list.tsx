import { Lock01 } from '@untitledui/icons';
import { Link } from 'react-router';
import type { LessonStepListProps } from '@/components/lesson/lesson-step-list/types';
import { cx } from '@/utils/cx';

const lockedReason = 'Спершу пройди попередній крок';

export function LessonStepList({ steps, currentStepId, label }: LessonStepListProps) {
  return <ol aria-label={label} className="space-y-1">
    {steps.map((step, index) => {
      const current = step.id === currentStepId;
      const number = <span className="w-5 shrink-0 text-xs font-semibold text-quaternary">{index + 1}</span>;
      return <li key={step.id}>
        {step.reachable
          ? <Link
            to={step.href}
            aria-current={current ? 'step' : undefined}
            className={cx(
              'flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm outline-brand transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2',
              current ? 'bg-brand-primary font-semibold text-brand-secondary' : 'text-secondary',
            )}
          >
            {number}<span className="min-w-0 flex-1">{step.title}</span>
          </Link>
          : <a role="link" aria-disabled="true" aria-describedby={`step-locked-${step.id}`} className="flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-quaternary">
            {number}<span className="min-w-0 flex-1">{step.title}</span>
            <Lock01 className="size-4 shrink-0" aria-hidden="true" />
            <span id={`step-locked-${step.id}`} className="sr-only">{lockedReason}</span>
          </a>}
      </li>;
    })}
  </ol>;
}
