import { useState } from 'react';

export function useLessonProgressPanel() {
  const [confirmCacheClear, setConfirmCacheClear] = useState(false);
  const [cacheClearMessage, setCacheClearMessage] = useState<string | null>(null);

  return { confirmCacheClear, setConfirmCacheClear, cacheClearMessage, setCacheClearMessage };
}
