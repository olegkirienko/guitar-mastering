export function Track({ label, offset }: { label: string; offset: number }) {
  return <div>
    <p className="text-sm font-medium text-primary">{label}</p>
    <div className="relative mt-1 h-8 rounded-md bg-tertiary" aria-hidden="true">
      <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600" style={{ left: `${50 + offset * 40}%` }} />
    </div>
  </div>;
}
