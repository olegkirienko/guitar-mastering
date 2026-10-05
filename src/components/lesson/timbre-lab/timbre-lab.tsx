import { RefreshCcw01 } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { EnvelopeCurve } from '@/components/lesson/envelope-curve/envelope-curve';
import { OvertoneMixer } from '@/components/lesson/overtone-mixer/overtone-mixer';
import { SpectrumBars } from '@/components/lesson/spectrum-bars/spectrum-bars';
import { EnvelopeControls } from '@/components/lesson/timbre-lab/components/envelope-controls/envelope-controls';
import { labModes } from '@/components/lesson/timbre-lab/constants';
import { useTimbreLab } from '@/components/lesson/timbre-lab/hooks/use-timbre-lab';
import type { TimbreLabProps } from '@/components/lesson/timbre-lab/types';
import { TimbreWave } from '@/components/lesson/timbre-wave/timbre-wave';
import { playbackGain } from '@/data/lessons/stage-01-lesson-04-model/constants';
import { toPartialsSound } from '@/data/lessons/stage-01-lesson-04-model/utils/partials';

// One sound the learner builds. The lab is controlled: the screen owns the sound,
// so it can tell what the learner has already tried.
export function TimbreLab({ mode, content, words, envelopeWords, sound, start, onChange, audio }: TimbreLabProps) {
  const config = labModes[mode];
  const { titleId, announcement, chooseLevel, chooseAttack, chooseDecay, choosePreset, reset } = useTimbreLab({ content, sound, start, onChange });
  const levels = config.levels.map((level) => ({ id: level, label: content.levels[level] }));
  const presets = content.presets;
  return <section aria-labelledby={titleId} className="space-y-5 rounded-lg border border-secondary bg-primary p-4 sm:p-5">
    <div>
      <h3 id={titleId} className="font-semibold text-primary">{content.title}</h3>
      <p className="mt-1 text-sm text-tertiary">{content.note}</p>
    </div>

    <OvertoneMixer content={content.mixer} multiples={config.multiples} levels={levels} sound={sound} onChange={config.lockedOvertones ? undefined : chooseLevel} />

    {content.spectrum && <SpectrumBars content={content.spectrum} sound={sound} />}

    {content.envelope && <>
      <EnvelopeControls content={content.envelope} sound={sound} onAttack={chooseAttack} onDecay={chooseDecay} />
      <EnvelopeCurve sound={sound} label={content.envelope.curveLabel} words={envelopeWords} />
    </>}

    {content.waveLabel && <TimbreWave sound={sound} label={content.waveLabel} words={words} showPartials={config.showPartials} />}

    <p role="status" className="text-sm font-medium text-secondary">{announcement}</p>

    <div className="space-y-3">
      {audio.enabled && <Button color="secondary" size="lg" onClick={() => audio.playPartials(toPartialsSound(sound), playbackGain)}>{content.listenLabel}</Button>}
      {presets && <div className="space-y-2">
        <p className="text-sm font-medium text-primary">{presets.label}</p>
        <div className="flex flex-wrap gap-2">
          {presets.options.map((preset) => <Button key={preset.id} color="secondary" size="md" className="min-h-11" onClick={() => choosePreset(preset.id, preset.label)}>{preset.label}</Button>)}
          <Button color="secondary" size="md" className="min-h-11" iconLeading={RefreshCcw01} onClick={reset}>{presets.resetLabel}</Button>
        </div>
      </div>}
    </div>
  </section>;
}
