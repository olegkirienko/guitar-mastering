import { lessonOneId } from '@/progress/lesson-one/constants';

export function lessonOneUserStorageKey(userId: string): string {
  return `guitar-mastering:user:${encodeURIComponent(userId)}:${lessonOneId}`;
}

export function lessonOneImportDecisionKey(userId: string): string {
  return `${lessonOneUserStorageKey(userId)}:guest-import`;
}
