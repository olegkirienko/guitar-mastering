// Untitled UI has no free skeleton, so this is a minimal placeholder.
export function PageSkeleton() {
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14" aria-busy="true">
    <p role="status" className="sr-only">Завантаження…</p>
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-4 w-32 rounded bg-tertiary" />
      <div className="h-10 w-3/4 rounded bg-tertiary" />
      <div className="h-40 rounded-xl bg-tertiary" />
    </div>
  </main>;
}
