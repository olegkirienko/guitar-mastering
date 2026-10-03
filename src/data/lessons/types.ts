export type LessonStatus = 'available' | 'next' | 'locked';

export interface Lesson {
  id: string;
  number: string;
  title: string;
  description: string;
  status: LessonStatus;
}
