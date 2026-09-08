import { twMerge } from 'tailwind-merge';

export function cx(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(' '));
}
