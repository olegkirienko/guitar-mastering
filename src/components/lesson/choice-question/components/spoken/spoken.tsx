// Screen readers get the spoken form (e.g. «герців» instead of «Гц») when there is one.
export function Spoken({ text, spoken }: { text: string; spoken?: string }) {
  if (!spoken) return <>{text}</>;
  return <><span aria-hidden="true">{text}</span><span className="sr-only">{spoken}</span></>;
}
