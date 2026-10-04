import { useAuth } from '@/hooks/use-auth';
import { useCourseProgress } from '@/hooks/use-course-progress/use-course-progress';
import { courseLessons } from '@/progress/course/constants';
import { resolveResumePath } from '@/progress/core/utils/resolve-resume-path';

// Guests go to sign-in; a signed-in learner resumes where they stopped.
export function useHomePage() {
  const auth = useAuth();
  const signedIn = auth.state === 'authenticated';
  const course = useCourseProgress(signedIn);
  const courseHref = !signedIn
    ? '/auth'
    : course.status === 'ready' ? resolveResumePath(course.items, courseLessons) : '/course';
  return { courseHref };
}
