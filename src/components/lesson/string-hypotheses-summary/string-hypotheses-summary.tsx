import { Badge } from '@/components/base/badges/badges';
import type { StringHypothesesSummaryProps } from '@/components/lesson/string-hypotheses-summary/types';
import type { HypothesisId } from '@/data/lessons/stage-01-lesson-03/types';

// Screen `complete`: every `intro` guess against the experiments; the learner's picks are marked.
export function StringHypothesesSummary({ intro, content, selected, own }: StringHypothesesSummaryProps) {
  const confirmed: readonly HypothesisId[] = content.confirmedIds;
  const ownText = own.trim();
  return <section aria-labelledby="hypotheses-summary-title" className="space-y-3">
    <h3 id="hypotheses-summary-title" className="font-semibold text-primary">{content.hypothesesTitle}</h3>
    <p className="text-sm text-tertiary">{content.hypothesesNote}</p>
    <ul className="space-y-2">
      {intro.hypotheses.filter((hypothesis) => hypothesis.id !== 'own').map((hypothesis) => <li key={hypothesis.id} className="space-y-1 rounded-lg border border-secondary p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-primary">{hypothesis.label}</span>
          <Badge type="pill-color" color={confirmed.includes(hypothesis.id) ? 'success' : 'gray'} size="sm">{confirmed.includes(hypothesis.id) ? content.confirmedLabel : content.separateLabel}</Badge>
          {selected.includes(hypothesis.id) && <Badge type="pill-color" color="brand" size="sm">{content.yourGuessLabel}</Badge>}
        </div>
        <p className="text-secondary">{content.verdicts[hypothesis.id]}</p>
      </li>)}
      {selected.includes('own') && <li className="space-y-1 rounded-lg border border-secondary p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-primary">{ownText === '' ? content.ownLabel : `${content.ownLabel}: ${ownText}`}</span>
          <Badge type="pill-color" color="brand" size="sm">{content.yourGuessLabel}</Badge>
        </div>
        <p className="text-secondary">{content.ownVerdict}</p>
      </li>}
    </ul>
  </section>;
}
