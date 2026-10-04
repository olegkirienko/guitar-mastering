import type { CourseLessonStatus } from '@/pages/course-page/types';

export const statusBadges: Record<CourseLessonStatus, { label: string; color: 'gray' | 'brand' | 'success' }> = {
  locked: { label: 'Після попереднього уроку', color: 'gray' },
  'not-started': { label: 'Не розпочато', color: 'gray' },
  'in-progress': { label: 'Триває', color: 'brand' },
  completed: { label: 'Завершено', color: 'success' },
};
