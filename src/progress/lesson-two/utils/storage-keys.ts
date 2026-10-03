import { lessonTwoId } from '@/progress/lesson-two/constants';

export function lessonTwoUserStorageKey(userId: string): string {
  return `guitar-mastering:user:${encodeURIComponent(userId)}:${lessonTwoId}`;
}

export function lessonTwoImportDecisionKey(userId: string): string {
  return `${lessonTwoUserStorageKey(userId)}:guest-import`;
}
