import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import type { HypothesisId } from '@/data/lessons/stage-01-lesson-03/types';

// Shared wording of every one-factor experiment; each step adds its own factor text.
export const factorExperimentText = {
  lockedNote: 'не змінюємо в цьому досліді',
  pluckLabel: 'Смикнути струну',
  frequencyLabel: 'Частота',
  trackNote: 'Схема уповільнена: що частіші коливання, то щільніші повтори на доріжці. Справжня частота показана числом.',
  more: 'частіше, ніж було',
  less: 'рідше, ніж було',
  same: 'так само, як було',
  notTried: 'ще не пробували',
  frequencyHeader: 'Частота',
} as const;

export const lessonThreeContent = {
  id: 'stage-01-lesson-03',
  stageLabel: 'Етап I · Звук',
  title: 'Від чого залежить частота струни?',
  estimatedTime: '10–14 хв',
  progressStops: ['Здогадки', 'Довжина', 'Туго', 'Вага', 'Модель', 'Перевірка'],
  // The audio switch and its messages are the same as in Lesson 2.
  preferences: lessonTwoContent.preferences,
  intro: {
    title: 'Повернімося до питання',
    reminder: 'Вищий звук = частіші коливання.',
    question: lessonTwoContent.complete.bridge,
    invitation: 'Обери одну чи кілька здогадок або допиши свою. Можна й нічого не обирати.',
    hypothesesLabel: 'Мої здогадки',
    hypotheses: [
      { id: 'length', label: 'Довжина' },
      { id: 'tension', label: 'Наскільки туго натягнута' },
      { id: 'thickness', label: 'Товщина' },
      { id: 'material', label: 'Матеріал' },
      { id: 'force', label: 'Сила удару' },
      { id: 'own', label: 'Свій варіант' },
    ] satisfies readonly { id: HypothesisId; label: string }[],
    ownLabel: 'Моя здогадка',
    forceNote: 'Сила удару змінює гучність — це ми бачили в уроці 2. Чи змінює вона висоту, з’ясуємо пізніше.',
    feedback: 'Перевіримо кожну здогадку дослідом.',
    startLabel: 'Перевірити дослідом',
  },
  length: {
    title: 'Яка частина струни тремтить?',
    instruction: 'Порівняй відкриту й притиснуту струну: яка її частина тремтить?',
    guitar: {
      title: 'Спершу на гітарі',
      withGuitar: 'Смикни відкриту першу (найтоншу) струну. Тепер притисни її ближче до корпусу, як в уроці 2, і смикни знову. Легко торкнися нігтем іншої руки струни з різних боків від пальця: де вона тремтить?',
      withoutGuitar: 'Подивися на схему: підсвічено ту частину струни, яка тремтить.',
      safety: 'Притискай легко, не до болю, і не крути кілки.',
    },
    diagram: {
      caption: 'Яка частина струни тремтить',
      openLabel: 'Відкрита струна: тремтить уся струна від поріжка до підставки.',
      pressedLabel: 'Притиснута струна: тремтить лише частина від пальця до підставки.',
    },
    prediction: {
      question: 'Ми змінили не всю струну, а лише ту частину, яка тремтить. Якщо зробити її ще коротшою, коливання стануть частішими чи рідшими?',
      choices: [
        { id: 'more', label: 'Частішими', feedback: 'Перевір у досліді нижче.' },
        { id: 'less', label: 'Рідшими', feedback: 'Перевір у досліді нижче.' },
        { id: 'same', label: 'Не зміниться', feedback: 'Перевір у досліді нижче.' },
      ],
      correctChoiceId: 'more',
    },
    experiment: {
      ...factorExperimentText,
      title: 'Дослід: змінюємо лише довжину',
      note: 'Змінюй тільки довжину частини, яка тремтить. Усе інше лишається тим самим.',
      factorLabels: {
        length: 'Довжина частини, яка тремтить',
        tension: 'Наскільки туго натягнута',
        density: 'Скільки важить кожен сантиметр',
      },
      tableCaption: 'Що ми побачили',
      levelHeader: 'Довжина',
      tryMore: 'Спробуй щонайменше ще одну довжину.',
      naming: {
        before: 'Відрізок, який тремтить, називають ',
        term: 'довжиною частини, що коливається',
        after: '.',
        rule: 'Коротша частина → частіші коливання → вищий звук.',
      },
      application: 'Ось чому притиснута струна в уроці 2 звучала вище: палець укоротив частину, яка тремтить.',
    },
    backLabel: 'Назад до здогадок',
  },
  tension: { title: 'Наскільки туго?' },
  density: { title: 'Товста чи важка?' },
  model: { title: 'Три ручки однієї струни' },
  checkpoint: { title: 'Зроби сам і поясни' },
  complete: { title: 'Що ми з’ясували' },
} as const;
