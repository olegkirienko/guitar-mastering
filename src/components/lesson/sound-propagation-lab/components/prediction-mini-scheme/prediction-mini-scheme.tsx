export function PredictionMiniScheme({ model }: { model: 'same-air' | 'change' }) {
  return <svg viewBox="0 0 180 42" className="mt-3 h-auto w-full max-w-52" aria-hidden="true">
    <line className="stroke-border-primary" x1="15" y1="21" x2="165" y2="21" strokeWidth="2" />
    {model === 'same-air' ? <>
      <circle className="fill-fg-brand-primary" cx="25" cy="21" r="7" />
      <path className="stroke-fg-brand-primary" d="M 40 21 H 143" strokeWidth="2" markerEnd="url(#prediction-arrow-a)" />
      <circle className="fill-fg-brand-primary" cx="155" cy="21" r="7" />
      <defs><marker id="prediction-arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path className="fill-fg-brand-primary" d="M0,0 L6,3 L0,6 Z" /></marker></defs>
    </> : <>
      {[25, 51, 77, 103, 129, 155].map((x, index) => <circle key={x} cx={x + (index === 2 ? 4 : index === 3 ? -4 : 0)} cy="21" r="5" className={index === 2 ? 'fill-fg-brand-primary' : 'fill-fg-quaternary'} />)}
      <path className="stroke-fg-brand-primary" d="M 31 9 H 149" strokeWidth="2" markerEnd="url(#prediction-arrow-b)" />
      <path className="stroke-utility-brand-700" d="M 68 34 H 86 M 68 34 L 73 31 M 68 34 L 73 37 M 86 34 L 81 31 M 86 34 L 81 37" strokeWidth="1.5" />
      <defs><marker id="prediction-arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path className="fill-fg-brand-primary" d="M0,0 L6,3 L0,6 Z" /></marker></defs>
    </>}
  </svg>;
}
