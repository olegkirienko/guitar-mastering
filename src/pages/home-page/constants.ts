import { Headphones02, Microscope, MusicNote02 } from '@untitledui/icons';

// Three of the course's parallel tracks (docs/course-map/README.md), told as what the learner does.
export const learningModes = [
  {
    icon: Headphones02,
    title: 'Слухай',
    description: 'Кожен урок починається зі звуку, а не з визначення: спершу чуєш явище, потім даєш йому назву.',
  },
  {
    icon: Microscope,
    title: 'Пробуй',
    description: 'Передбачаєш результат, перевіряєш його в інтерактивному досліді й бачиш, де помилився.',
  },
  {
    icon: MusicNote02,
    title: 'Грай',
    description: 'Переносиш відкриття на гітару руками. Немає інструмента — є віртуальна струна.',
  },
] as const;

// The eight stages of docs/course-map/README.md; a stage's lessons come from the course catalog.
export const courseStages = [
  { number: 1, title: 'Звук' },
  { number: 2, title: 'Музична система' },
  { number: 3, title: 'Гітара як карта звуків' },
  { number: 4, title: 'Час і ритм' },
  { number: 5, title: 'Інтервали та мелодія' },
  { number: 6, title: 'Гами, тональність, мажор і мінор' },
  { number: 7, title: 'Гармонія та акорди' },
  { number: 8, title: 'Музична мова і класична гітара' },
] as const;

export const requirements = [
  { title: 'Гітара — або без неї', description: 'Класична шестиструнна ідеально, але кожен дослід має віртуальну заміну.' },
  { title: '15–20 хвилин на урок', description: 'Короткі кроки: можна зупинитися будь-де й продовжити з того ж місця.' },
  { title: 'Жодної теорії наперед', description: 'Терміни з’являються лише тоді, коли ти вже зустрів явище, яке вони називають.' },
] as const;
