import type { ProgressItem } from '@/progress/core/types';

export type CourseProgress = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: ProgressItem[];
  retry(): void;
};
