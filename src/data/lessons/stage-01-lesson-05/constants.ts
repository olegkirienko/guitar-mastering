import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import { lessonFourContent } from '@/data/lessons/stage-01-lesson-04/constants';

// The closing lesson of Stage I adds nothing: it is the final lab of the stage map,
// so every screen reuses what Lessons 1–4 built — including their wording.
export const lessonFiveContent = {
  id: 'stage-01-lesson-05',
  stageLabel: 'Етап I · Звук',
  title: 'Що відбувається від щипка до того, як ми чуємо звук?',
  estimatedTime: '8–12 хв',
  progressStops: ['Задача', 'Вище', 'Нижче', 'Той самий звук', 'Шлях', 'Підсумок'],
  preferences: lessonTwoContent.preferences,
  // The same lab the learner met in Lesson 3, down to the three rules its wrong-direction
  // hint quotes: the check has to look like the lab where this skill was learned.
  lab: lessonThreeContent.model.lab,
  intro: {
    title: 'Що ти вже вмієш',
    reminder: lessonFourContent.complete.bridge,
    question: 'Що відбувається від моменту, коли ми смикаємо струну, до моменту, коли чуємо звук?',
    note: 'Нових слів тут не буде. Буде чотири задачі; усе потрібне ти вже знаєш.',
    tasksTitle: 'Чотири задачі',
    tasks: [
      'Підняти висоту звуку, коли густину чіпати не можна.',
      'Опустити висоту, коли не можна чіпати довжину.',
      'Пояснити два звуки однакової висоти, які звучать по-різному.',
      'Скласти весь шлях звуку — від струни до того, як ми його чуємо.',
    ],
    tasksNote: 'У кожній задачі є результат, який ти зробиш сам, а не відповідь із варіантів.',
    guitar: {
      title: 'Перед початком — одна струна',
      withGuitar: 'Смикни будь-яку струну й подивися на неї. Тепер поклади на неї палець: струна зупиняється — звук зникає. З цього починався етап I.',
      withoutGuitar: 'Натисни «Послухати»: це той самий щипок, 220 Гц. Струна коливається — ми чуємо звук; струна зупиняється — звук зникає.',
      safety: 'Смикай м’яко, подушечкою пальця.',
    },
    listenLabel: 'Послухати',
    startLabel: 'Почати',
  },
  higher: {
    title: 'Зроби звук вищим, не чіпаючи густину',
    instruction: 'Задача 1. Спершу прогноз, потім лабораторія.',
    prediction: {
      question: 'Густину чіпати не можна. Скільки чинників лишається, щоб підняти висоту?',
      choices: [
        { id: 'two', label: 'Два: довжина частини, що коливається, і натяг.', feedback: 'Перевір у лабораторії нижче.' },
        { id: 'one', label: 'Один: лише довжина частини, що коливається.', feedback: 'Перевір у лабораторії нижче.' },
        { id: 'none', label: 'Жодного: без густини висоту не змінити.', feedback: 'Перевір у лабораторії нижче.' },
        { id: 'three', label: 'Три: ще можна смикнути сильніше.', feedback: 'Перевір у лабораторії нижче.' },
      ],
      correctChoiceId: 'two',
    },
    task: {
      model: { id: 'higher-same-density', start: { length: 0.75, tension: 1, density: 4 }, lockedFactor: 'density', direction: 'higher' },
      title: 'Задача 1. Зроби звук вищим, не чіпаючи густину',
      goal: 'Старт: 147 Гц. Густину заблоковано — зміни інший чинник і натисни «Перевірити».',
      sameHint: 'Частота поки та сама, 147 Гц. Густину не чіпаємо — спробуй довжину частини, що коливається, або натяг.',
      wrongHint: 'Звук став нижчим, а треба вищим. Згадай правило:',
      solved: 'Виконано: звук вищий, а густина та сама.',
      lockedNote: 'густина заблокована: струна лишається найважчою',
      checkLabel: 'Перевірити',
      resetLabel: 'Почати задачу знову',
      startText: 'старт задачі',
    },
    pattern: 'Висота зросла, а густина та сама: коротша частина, що коливається, або тугіший натяг — більше коливань за секунду.',
    backLabel: 'Назад: чотири задачі',
    nextLabel: 'Далі: задача 2',
  },
  lower: {
    title: 'Зроби звук нижчим, не чіпаючи довжину',
    instruction: 'Задача 2. Знову спершу прогноз, потім лабораторія.',
    prediction: {
      question: 'Довжину заблоковано. Що опустить висоту?',
      choices: [
        { id: 'tension-density', label: 'Відпустити натяг або взяти важчу струну.', feedback: 'Перевір у лабораторії нижче.' },
        { id: 'quieter', label: 'Смикнути тихіше.', feedback: 'Перевір у лабораторії нижче.' },
        { id: 'overtones', label: 'Прибрати обертони.', feedback: 'Перевір у лабораторії нижче.' },
        { id: 'longer', label: 'Подовжити частину, що коливається.', feedback: 'Перевір у лабораторії нижче.' },
      ],
      correctChoiceId: 'tension-density',
    },
    task: {
      model: { id: 'lower-same-length', start: { length: 0.5, tension: 4, density: 1 }, lockedFactor: 'length', direction: 'lower' },
      title: 'Задача 2. Зроби звук нижчим, не чіпаючи довжину',
      goal: 'Старт: 880 Гц. Довжину заблоковано — зміни інший чинник і натисни «Перевірити».',
      sameHint: 'Частота поки та сама, 880 Гц. Довжину не чіпаємо — спробуй натяг або густину.',
      wrongHint: 'Звук став вищим, а треба нижчим. Згадай правило:',
      solved: 'Виконано: звук нижчий, а довжина та сама.',
      lockedNote: 'довжина заблокована: коливається половина струни',
      checkLabel: 'Перевірити',
      resetLabel: 'Почати задачу знову',
      startText: 'старт задачі',
    },
    pattern: 'Та сама довжина — інша висота: слабший натяг або важча струна дають менше коливань за секунду.',
    backLabel: 'Назад: задача 1',
    nextLabel: 'Далі: той самий звук',
  },
  timbre: {
    title: 'Висота та сама — звук інший',
  },
  path: {
    title: 'Поясни шлях',
  },
  complete: {
    title: 'Етап I зібрано',
  },
} as const;
