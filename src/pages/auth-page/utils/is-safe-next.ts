import { courseLessons } from '@/progress/course/constants';

const unsafeCharacters = /[\\\u0000-\u001f\u007f]|%2f|%5c/i;

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/course' || pathname === '/account') return true;
  const match = /^\/lessons\/([^/]+)(?:\/([^/]+))?$/.exec(pathname);
  if (!match) return false;
  const lesson = courseLessons.find((candidate) => candidate.routeId === match[1]);
  return Boolean(lesson) && (match[2] === undefined || Boolean(lesson?.steps.some((step) => step.id === match[2])));
}

// `next` after sign-in must be a same-origin protected route; `/` and `/auth` never qualify, so no loop.
export function isSafeNext(next: string, origin: string): boolean {
  if (unsafeCharacters.test(next)) return false;
  let url: URL;
  try {
    url = new URL(next, origin);
  } catch {
    return false;
  }
  return url.origin === origin && isProtectedPath(url.pathname);
}

// The bare pathname of a safe `next`, without its query and hash; otherwise null.
export function safeNextPath(next: string | null, origin: string): string | null {
  if (next === null || !isSafeNext(next, origin)) return null;
  return new URL(next, origin).pathname;
}
