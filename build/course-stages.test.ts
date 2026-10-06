import { describe, expect, it } from 'vitest';
import type { CourseLessonView } from '../src/pages/course-page/types.ts';
import { groupByStage } from '../src/pages/course-page/utils/group-by-stage.ts';
import { courseLessons } from '../src/progress/course/constants.ts';

function view(routeId: string, stageLabel: string, status: CourseLessonView['status']): CourseLessonView {
  return { routeId, title: `Урок ${routeId}`, stageLabel, status, steps: [] };
}

describe('groupByStage', () => {
  it('puts every lesson of one stage under one heading, with the completed count', () => {
    const stages = groupByStage([
      view('01', 'Етап I · Звук', 'completed'),
      view('02', 'Етап I · Звук', 'in-progress'),
      view('03', 'Етап I · Звук', 'locked'),
    ]);
    expect(stages).toHaveLength(1);
    expect(stages[0]).toMatchObject({ label: 'Етап I · Звук', completed: 1, total: 3 });
    expect(stages[0].lessons.map((lesson) => lesson.routeId)).toEqual(['01', '02', '03']);
  });

  it('starts a new stage when the label changes, keeping course order', () => {
    const stages = groupByStage([
      view('01', 'Етап I · Звук', 'completed'),
      view('02', 'Етап I · Звук', 'completed'),
      view('03', 'Етап II · Гриф', 'not-started'),
    ]);
    expect(stages.map((stage) => [stage.label, stage.completed, stage.total])).toEqual([
      ['Етап I · Звук', 2, 2],
      ['Етап II · Гриф', 0, 1],
    ]);
  });

  it('returns no stage for an empty course', () => {
    expect(groupByStage([])).toEqual([]);
  });

  it('groups today\'s catalog into the one delivered stage', () => {
    const stages = groupByStage(courseLessons.map((lesson) => view(lesson.routeId, lesson.stageLabel, 'not-started')));
    expect(stages).toHaveLength(1);
    expect(stages[0]).toMatchObject({ label: 'Етап I · Звук', completed: 0, total: courseLessons.length });
  });
});
