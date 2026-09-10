export type LessonStatus = 'available' | 'next' | 'locked';

export interface Lesson {
  id: string;
  number: string;
  title: string;
  description: string;
  status: LessonStatus;
}

export const lessons: Lesson[] = [
  {
    id: '01',
    number: '01',
    title: 'Що таке звук?',
    description: 'Від щипка струни до того, як ми сприймаємо звук.',
    status: 'available',
  },
  {
    id: '02',
    number: '02',
    title: 'Ноти, тон і півтон',
    description: 'Чому нот сім, звідки береться октава та як усе це побачити на піаніно.',
    status: 'next',
  },
  {
    id: '03',
    number: '03',
    title: 'Як влаштована гітара',
    description: 'Шість струн, стрій, гриф, лади та розташування нот.',
    status: 'next',
  },
  {
    id: '04',
    number: '04',
    title: 'Інтервали',
    description: 'Відстані між нотами — фундамент для розуміння акордів і мелодій.',
    status: 'next',
  },
  {
    id: '05',
    number: '05',
    title: 'Мажор і мінор',
    description: 'Звідки береться відчуття мажору й мінору та як вони будуються.',
    status: 'next',
  },
  {
    id: '06',
    number: '06',
    title: 'Акорди',
    description: 'Як із нот та інтервалів виникають тризвуки й знайомі нам акорди.',
    status: 'next',
  },
];
