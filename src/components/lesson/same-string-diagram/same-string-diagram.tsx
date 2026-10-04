import type { SameStringDiagramProps } from '@/components/lesson/same-string-diagram/types';
import { StringState } from '@/components/lesson/same-string-diagram/components/string-state/string-state';

export function SameStringDiagram({ openLabel, pressedLabel, caption }: SameStringDiagramProps) {
  return <figure className="rounded-lg border border-secondary bg-secondary p-4">
    <figcaption className="text-sm font-semibold text-primary">{caption}</figcaption>
    <div className="mt-3 grid gap-3">
      <StringState pressed={false} label={openLabel} />
      <StringState pressed label={pressedLabel} />
    </div>
  </figure>;
}
