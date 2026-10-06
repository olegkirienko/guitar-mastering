import { useState } from 'react';
import type { LessonRestartProps } from '@/components/lesson/lesson-restart/types';

// The dialog stays open while the reset runs and after it fails, so the learner can try again.
export function useLessonRestart({ onConfirm }: LessonRestartProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const openDialog = (isOpen: boolean) => {
    if (pending) return;
    setOpen(isOpen);
    if (!isOpen) setFailed(false);
  };

  const confirm = async () => {
    setPending(true);
    setFailed(false);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return { open, pending, failed, openDialog, confirm };
}
