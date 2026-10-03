export function PredictionMiniScheme({ model }: { model: 'same-air' | 'change' }) {
  return <svg viewBox="0 0 180 42" className="mt-3 h-auto w-full max-w-52" aria-hidden="true">
    <line x1="15" y1="21" x2="165" y2="21" stroke="#D0D5DD" strokeWidth="2" />
    {model === 'same-air' ? <>
      <circle cx="25" cy="21" r="7" fill="#91472c" />
      <path d="M 40 21 H 143" stroke="#91472c" strokeWidth="2" markerEnd="url(#prediction-arrow-a)" />
      <circle cx="155" cy="21" r="7" fill="#91472c" />
      <defs><marker id="prediction-arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#91472c" /></marker></defs>
    </> : <>
      {[25, 51, 77, 103, 129, 155].map((x, index) => <circle key={x} cx={x + (index === 2 ? 4 : index === 3 ? -4 : 0)} cy="21" r="5" fill={index === 2 ? '#91472c' : '#98A2B3'} />)}
      <path d="M 31 9 H 149" stroke="#91472c" strokeWidth="2" markerEnd="url(#prediction-arrow-b)" />
      <path d="M 68 34 H 86 M 68 34 L 73 31 M 68 34 L 73 37 M 86 34 L 81 31 M 86 34 L 81 37" stroke="#783923" strokeWidth="1.5" />
      <defs><marker id="prediction-arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#91472c" /></marker></defs>
    </>}
  </svg>;
}
