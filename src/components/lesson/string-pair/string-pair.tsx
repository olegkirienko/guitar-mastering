import { Button } from '@/components/base/buttons/button';
import { RepeatDensityTrack } from '@/components/lesson/repeat-density-track/repeat-density-track';
import { StringSchematic } from '@/components/lesson/string-schematic/string-schematic';
import type { StringPairProps } from '@/components/lesson/string-pair/types';
import { stringFrequency } from '@/data/lessons/stage-01-lesson-03-model/utils/frequency';
import { pluckGain } from '@/data/lessons/stage-01-lesson-03-model/utils/gain';

// Virtual strings side by side: the text describes what the schematic, the track and the sound show.
export function StringPair({ caption, strings, pluckLabel, audio }: StringPairProps) {
  return <section aria-label={caption} className="grid gap-4 sm:grid-cols-2">
    {strings.map((item) => {
      const frequency = stringFrequency(item.settings);
      return <div key={item.id} className="space-y-3 rounded-lg border border-secondary bg-primary p-4">
        <h3 className="font-semibold text-primary">{item.label}</h3>
        <StringSchematic settings={item.settings} />
        <RepeatDensityTrack frequency={frequency} />
        <p className="text-sm leading-6 text-secondary">{item.description}</p>
        {audio.enabled && <Button color="secondary" size="lg" onClick={() => audio.playPluck(frequency, pluckGain(frequency))}>{`${pluckLabel}: ${item.label}`}</Button>}
      </div>;
    })}
  </section>;
}
