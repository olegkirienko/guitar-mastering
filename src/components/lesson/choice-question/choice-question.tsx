import { Spoken } from '@/components/lesson/choice-question/components/spoken/spoken';
import { useChoiceQuestion } from '@/components/lesson/choice-question/hooks/use-choice-question';
import type { ChoiceQuestionProps } from '@/components/lesson/choice-question/types';
import { CheckCircle, HelpCircle } from '@untitledui/icons';

export function ChoiceQuestion({ question, spokenQuestion, choices, correctChoiceId, mode = 'assessment', checkLabel = 'Перевірити', onCheck }: ChoiceQuestionProps) {
  const { selectedId, setSelectedId, checked, setChecked, id, selected, isCorrect } = useChoiceQuestion({ choices, correctChoiceId });
  return <fieldset className="space-y-4" aria-describedby={checked ? `${id}-feedback` : undefined}>
    <legend className="text-lg font-semibold text-gray-950"><Spoken text={question} spoken={spokenQuestion} /></legend>
    <div className="space-y-2">{choices.map((choice) => <label key={choice.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 text-gray-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2"><input type="radio" name={id} value={choice.id} checked={selectedId === choice.id} onChange={() => { setSelectedId(choice.id); setChecked(false); }} className="mt-1 size-4 accent-brand-600" /><span><Spoken text={choice.label} spoken={choice.spoken} /></span></label>)}</div>
    <button type="button" disabled={!selectedId} onClick={() => { if (selectedId) { setChecked(true); onCheck?.(selectedId, selectedId === correctChoiceId); } }} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{checkLabel}</button>
    {checked && selected && <div id={`${id}-feedback`} role="status" className="flex gap-3 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">{mode === 'assessment' && isCorrect ? <CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" /> : <HelpCircle className="mt-0.5 size-5 shrink-0 text-brand-700" />}<p><strong>{mode === 'prediction' ? 'Прогноз збережено.' : isCorrect ? 'Так.' : 'Це припущення можна перевірити.'}</strong> {selected.feedback}</p></div>}
  </fieldset>;
}
