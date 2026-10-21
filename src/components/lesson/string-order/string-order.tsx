import { Button } from '@/components/base/buttons/button';
import { useStringOrder } from '@/components/lesson/string-order/hooks/use-string-order';
import type { StringOrderProps } from '@/components/lesson/string-order/types';

export function StringOrder({ content, start, correct, onPlay, onSubmit }: StringOrderProps) {
  const { order, verdict, move, check } = useStringOrder({ start, correct, onSubmit });
  return <section aria-labelledby="string-order-title" className="space-y-3">
    <h3 id="string-order-title" className="font-semibold text-primary">{content.title}</h3>
    <p className="text-secondary">{content.help}</p>
    <ol className="space-y-2">
      {order.map((number, index) => <li key={number} className="flex flex-wrap items-center gap-2">
        <Button color="secondary" size="lg" onClick={() => onPlay(number)}>{content.item(number, index + 1)}</Button>
        <Button color="tertiary" size="lg" isDisabled={index === 0} onClick={() => move(index, -1)}>{content.up}</Button>
        <Button color="tertiary" size="lg" isDisabled={index === order.length - 1} onClick={() => move(index, 1)}>{content.down}</Button>
      </li>)}
    </ol>
    <Button color="secondary" size="lg" onClick={check}>{content.check}</Button>
    <p role="status" className="text-secondary">{verdict === null ? null : verdict ? content.right : content.wrong}</p>
  </section>;
}
