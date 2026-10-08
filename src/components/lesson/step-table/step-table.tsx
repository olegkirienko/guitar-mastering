import type { StepTableProps } from '@/components/lesson/step-table/types';
import { stepTable } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';

const hertz = (value: number) => value.toFixed(1).replace('.', ',');
const ratio = (value: number) => value.toFixed(4).replace('.', ',');

export function StepTable({ content, base }: StepTableProps) {
  const { headers, shortHeaders } = content;
  return <div className="overflow-x-auto">
    <table className="w-full text-left text-sm tabular-nums">
      <caption className="pb-2 text-left text-sm text-tertiary">{content.caption}</caption>
      <thead>
        <tr className="border-b border-secondary text-primary">
          {(['key', 'frequency', 'difference', 'ratio'] as const).map((column) => <th key={column} scope="col" className="py-2 pr-3 font-semibold">
            <span className="sm:hidden" aria-hidden="true" title={headers[column]}>{shortHeaders[column]}</span>
            <span className="sr-only sm:not-sr-only">{headers[column]}</span>
          </th>)}
        </tr>
      </thead>
      <tbody>
        {stepTable(base).map((row) => <tr key={row.key} className="border-b border-secondary text-secondary">
          <th scope="row" className="py-2 pr-3 font-medium text-primary">{row.key}</th>
          <td className="py-2 pr-3">{hertz(row.frequency)}</td>
          <td className="py-2 pr-3">{row.difference === null ? content.none : hertz(row.difference)}</td>
          <td className="py-2 pr-3">{row.ratio === null ? content.none : ratio(row.ratio)}</td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
