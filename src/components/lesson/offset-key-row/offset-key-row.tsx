import { KeyRow } from '@/components/lesson/key-row/key-row';
import type { OffsetKeyRowProps } from '@/components/lesson/offset-key-row/types';
import { offsetBase, offsetKeyCount, offsetNarrowKeys } from '@/components/lesson/offset-key-row/utils/offset';
import { isWhiteKey } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { namesOfKey, spokenName } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

export function OffsetKeyRow({ label, start, colors, keyLabel, onPlay, highlighted, trail, captions }: OffsetKeyRowProps) {
  return <KeyRow
    label={label}
    count={offsetKeyCount}
    base={offsetBase(start)}
    keyLabel={(key, frequency) => {
      const absolute = (start + key) % 12;
      return keyLabel(key, isWhiteKey(absolute) ? colors.white : colors.black, frequency, namesOfKey(absolute).map(spokenName));
    }}
    onPlay={onPlay}
    highlighted={highlighted}
    trail={trail}
    narrowKeys={offsetNarrowKeys(start)}
    captions={captions}
  />;
}
