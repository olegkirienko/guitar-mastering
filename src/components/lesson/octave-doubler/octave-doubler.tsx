import { Button } from '@/components/base/buttons/button';
import { useOctaveDoubler } from '@/components/lesson/octave-doubler/hooks/use-octave-doubler';
import type { OctaveDoublerProps } from '@/components/lesson/octave-doubler/types';

export function OctaveDoubler({ content, audio, gain, completed, onDone }: OctaveDoublerProps) {
  const { frequency, visited, prediction, setPrediction, tripled, announcement, canDouble, canHalve, canTriple, double, halve, tryTriple, listen, reset } = useOctaveDoubler({ content, audio, gain, onDone });
  const guessed = prediction !== null;
  const atEdge = !canDouble || !canHalve;
  return <section aria-label={content.chainTitle} className="space-y-5 rounded-lg border border-secondary bg-primary p-5">
    <p className="text-4xl font-semibold tabular-nums text-primary" data-testid="doubler-frequency">{frequency} <span className="text-lg text-tertiary">{content.unitLabel}</span></p>
    <fieldset className="space-y-2">
      <legend className="font-medium text-primary">{content.prediction.title}</legend>
      <div className="flex flex-wrap gap-2">
        {content.prediction.choices.map((choice) => <Button key={choice.id} color={prediction === choice.id ? 'primary' : 'secondary'} size="md" aria-pressed={prediction === choice.id} onClick={() => setPrediction(choice.id)}>{choice.label}</Button>)}
      </div>
      <p className="text-sm text-tertiary">{content.prediction.note}</p>
    </fieldset>
    <div className="flex flex-wrap gap-3">
      <Button color="secondary" size="lg" isDisabled={!guessed || !canHalve} onClick={halve}>{content.halveLabel}</Button>
      <Button color="secondary" size="lg" isDisabled={!guessed || !canDouble} onClick={double}>{content.doubleLabel}</Button>
      {audio.enabled && <Button color="secondary" size="lg" onClick={listen}>{content.listenLabel}</Button>}
      <Button color="tertiary" size="lg" onClick={reset}>{content.resetLabel}</Button>
    </div>
    {atEdge && <p className="text-sm text-tertiary">{content.limit}</p>}
    <p role="status" className="sr-only">{announcement}</p>
    <div>
      <h3 className="font-semibold text-primary">{content.chainTitle}</h3>
      <ol className="mt-2 flex flex-wrap items-center gap-2" aria-label={content.chainAlt(visited)}>
        {visited.map((value) => <li key={value} className={value === frequency ? 'rounded-md bg-brand-solid px-3 py-1 font-semibold tabular-nums text-white' : 'rounded-md bg-secondary px-3 py-1 tabular-nums text-secondary'}>{value}</li>)}
      </ol>
    </div>
    <div className="space-y-3 border-t border-secondary pt-4">
      <h3 className="font-semibold text-primary">{content.triple.title}</h3>
      <Button color="secondary" size="lg" isDisabled={!guessed || !canTriple} onClick={tryTriple}>{content.tripleLabel}</Button>
      {tripled !== null && <div role="status" className="space-y-1">
        <p className="text-secondary">{content.triple.result(frequency, tripled)}</p>
        <p className="font-medium text-primary">{content.triple.verdict}</p>
      </div>}
    </div>
    {completed && <p className="rounded-lg bg-secondary p-4 font-medium text-primary">{content.pattern}</p>}
  </section>;
}
