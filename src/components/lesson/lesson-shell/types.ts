export interface LessonShellProps {
  stageLabel: string;
  title: string;
  estimatedTime: string;
  progressStops: readonly string[];
  currentStop: number;
  backTo: string;
  children: React.ReactNode;
}
