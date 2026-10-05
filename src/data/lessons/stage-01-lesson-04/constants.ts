import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import { timbrePresets } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { DescriptionId } from '@/data/lessons/stage-01-lesson-04/types';

export const lessonFourContent = {
  id: 'stage-01-lesson-04',
  stageLabel: 'Етап I · Звук',
  title: 'Чому звуки однакової висоти звучать по-різному?',
  estimatedTime: '10–14 хв',
  // The step list and the progress stops are visible from the first screen, so they
  // stay in the plain words of the lesson: no term before the screen that earns it.
  progressStops: ['Описи', 'Малюнок', 'Хвилі в хвилі', 'Склад звуку', 'Початок і кінець', 'Перевірка'],
  // The audio switch and its messages are the same as in Lesson 2.
  preferences: lessonTwoContent.preferences,
  // Text alternative of every drawn wave; the model fills in the numbers.
  waveWords: {
    repeats: 'Повторів',
    overtones: 'обертони',
    noOvertones: 'обертонів немає',
    levels: { weak: 'слабкий', strong: 'сильний' },
  },
  intro: {
    title: 'Однакова висота — різні звуки',
    reminder: lessonThreeContent.complete.bridge,
    note: 'Піаніно тут немає, але така сама різниця є між будь-якими звуками однакової висоти. Послухаймо.',
    comparison: {
      caption: 'Три звуки, складені комп’ютером',
      frequencyLabel: 'Кожен звучить на 220 Гц.',
      listenLabel: 'Послухати',
      sounds: [
        { id: 'pure', label: 'А · чистий тон', description: 'Рівний, порожній звук — такий самий чистий тон, як в уроці 2.', sound: timbrePresets.pure },
        { id: 'pluck', label: 'Б · щипок', description: 'Різкий початок і поступове затихання, як у смикнутої струни.', sound: timbrePresets.pluck },
        { id: 'bright', label: 'В · дзвінкий тривалий', description: 'Яскравий, дзвінкий звук, який тримається довго.', sound: timbrePresets.bright },
      ],
    },
    guitar: {
      title: 'Те саме на гітарі',
      withGuitar: 'Смикни першу струну біля підставки, потім — над круглим отвором корпусу. Висота змінилася? А звук?',
      withoutGuitar: 'Послухай три звуки вище ще раз або перечитай їхні описи: висота однакова, а звучать вони по-різному.',
      safety: 'Смикай м’яко, подушечкою пальця.',
    },
    question: {
      question: 'Висота цих звуків однакова?',
      choices: [
        { id: 'yes', label: 'Так', feedback: 'Подивимось на числа.' },
        { id: 'no', label: 'Ні', feedback: 'Подивимось на числа.' },
        { id: 'unsure', label: 'Не впевнений', feedback: 'Подивимось на числа.' },
      ],
      correctChoiceId: 'yes',
    },
    answer: 'Частота всіх трьох — 220 Гц, тож висота однакова. А звуки різні.',
    hypothesesLabel: 'Чим вони різняться',
    invitation: 'Обери один чи кілька описів або допиши свій. Можна й нічого не обирати.',
    hypotheses: [
      { id: 'brightness', label: 'Яскравість' },
      { id: 'start', label: 'Початок звуку' },
      { id: 'duration', label: 'Як довго звучить' },
      { id: 'loudness', label: 'Гучність', note: 'Звуки зроблено однаково гучними, а з уроку 2 ти знаєш, що гучність висоти не змінює. Перевіримо, чи справді річ у ній.' },
      { id: 'own', label: 'Свій варіант' },
    ] satisfies readonly { id: DescriptionId; label: string; note?: string }[],
    ownId: 'own',
    ownLabel: 'Мій опис',
    feedback: 'Повернемося до цих описів наприкінці уроку.',
    startLabel: 'Подивитися на малюнки',
  },
  shape: {
    title: 'Що однакове на малюнку?',
    instruction: 'Ті самі три звуки — тепер очима.',
    prediction: {
      question: 'Ці звуки однакові за висотою. Що буде однаковим на їхніх малюнках?',
      choices: [
        { id: 'repeats', label: 'Скільки разів повторюється', feedback: 'Перевіримо на малюнках нижче.' },
        { id: 'shape', label: 'Форма повтору', feedback: 'Перевіримо на малюнках нижче.' },
        { id: 'both', label: 'І те, і те', feedback: 'Перевіримо на малюнках нижче.' },
      ],
      correctChoiceId: 'repeats',
    },
    wavesTitle: 'Той самий відрізок часу для всіх трьох',
    wavesNote: 'Пунктирні лінії позначають межі повторів.',
    count: {
      question: 'Скільки повторів у кожного?',
      choices: [
        { id: 'two', label: 'По два', feedback: 'Полічи межі повторів ще раз: їх по три в кожного.' },
        { id: 'three', label: 'По три', feedback: 'По три в усіх трьох.' },
        { id: 'different', label: 'По-різному', feedback: 'Полічи межі повторів ще раз: їх по три в кожного.' },
      ],
      correctChoiceId: 'three',
    },
    pattern: 'Однаково часто повторюється → однакова висота. Форма кожного повтору різна → звук різний.',
    termTitle: 'Тембр',
    term: 'Те, чим різняться звуки однакової висоти й гучності, називають тембром. За тембром ти впізнаєш знайомий голос, не бачачи людини.',
    nextQuestion: 'Звідки береться інша форма, якщо повтори ті самі?',
    backLabel: 'Назад до описів',
  },
  overtones: { title: 'Хвилі всередині хвилі' },
  spectrum: { title: 'Склад звуку' },
  envelope: { title: 'Початок і кінець звуку' },
  checkpoint: { title: 'Зроби сам і поясни' },
  complete: { title: 'Що ми з’ясували' },
} as const;
