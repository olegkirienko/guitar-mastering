import type { LessonProgressController } from '@/progress/use-lesson-progress/types';

export type LessonProgressPanelProps = Pick<
  LessonProgressController<unknown>,
  | 'storageAvailable'
  | 'sync'
  | 'accountState'
  | 'importGuestProgress'
  | 'confirmGuestImport'
  | 'keepGuestProgressSeparate'
  | 'clearCurrentAccountCache'
  | 'retrySync'
>;
