import { spokenName } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

// A name with a sign, written with symbols on screen and in words for a screen reader.
export function SignedName({ name }: { name: string }) {
  return <>
    <span aria-hidden="true">{name}</span>
    <span className="sr-only">{spokenName(name)}</span>
  </>;
}
