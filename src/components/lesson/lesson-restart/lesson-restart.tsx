import { Dialog, DialogTrigger, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { useLessonRestart } from '@/components/lesson/lesson-restart/hooks/use-lesson-restart';
import {
  restartCancelLabel, restartConfirmLabel, restartExplanation, restartFailedMessage, restartTitle, restartTriggerLabel,
} from '@/components/lesson/lesson-restart/constants';
import type { LessonRestartProps } from '@/components/lesson/lesson-restart/types';

// Starting over is destructive, so it is confirmed in a dialog before anything is cleared.
export function LessonRestart({ onConfirm }: LessonRestartProps) {
  const { open, pending, failed, openDialog, confirm } = useLessonRestart({ onConfirm });
  return <DialogTrigger isOpen={open} onOpenChange={openDialog}>
    <Button color="secondary-destructive" size="md" className="w-full">{restartTriggerLabel}</Button>
    <ModalOverlay isDismissable={!pending}>
      <Modal className="max-w-lg">
        <Dialog className="p-6">
          <h2 slot="title" className="text-lg font-semibold text-primary">{restartTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-tertiary">{restartExplanation}</p>
          <p className="mt-3 text-sm text-error-primary" aria-live="polite">{failed && restartFailedMessage}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button color="primary-destructive" size="lg" isLoading={pending} isDisabled={pending} onClick={() => void confirm()}>
              {restartConfirmLabel}
            </Button>
            <Button color="tertiary" size="lg" isDisabled={pending} onClick={() => openDialog(false)}>{restartCancelLabel}</Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>;
}
