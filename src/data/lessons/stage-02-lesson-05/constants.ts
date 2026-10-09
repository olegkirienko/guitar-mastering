import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonNineContent } from '@/data/lessons/stage-02-lesson-04/constants';
import type { CountTask, OctaveTask } from '@/data/lessons/stage-02-lesson-05/types';

export const formatHertz = (frequency: number) => `${frequency.toFixed(1).replace('.', ',')} Гц`;

// Frequencies that lesson 1 never used: one goes both ways, the other only up.
export const octaveTasks: readonly OctaveTask[] = [
  { id: 'down-330', frequency: 330, direction: 'down' },
  { id: 'up-330', frequency: 330, direction: 'up' },
  { id: 'up-110', frequency: 110, direction: 'up' },
];

// Three plain pairs and one trap: F♭ is the white key E.
export const countTasks: readonly CountTask[] = [
  { id: 'white', from: 'E', to: 'A' },
  { id: 'black', from: 'C♯', to: 'F' },
  { id: 'edge', from: 'B', to: 'D' },
  { id: 'trap', from: 'F♭', to: 'G', trap: 'F♭ — це та сама клавіша, що E, тож до G три півтони, а не два.' },
];

// Where the walk may begin: white keys only.
export const walkStartLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export const walkSteps = 12;

// The string and the sound an octave above it, as in lessons 3–4.
export const guitarStringHertz = 110;
export const guitarOctaveHertz = guitarStringHertz * 2;

// Stage II lesson 5 teaches nothing new: every word below was named in lessons 1–4.
export const lessonTenContent = {
  id: 'stage-02-lesson-05',
  stageLabel: 'Етап II · Музична система',
  title: 'Звідки взялися ноти?',
  estimatedTime: '10–14 хв',
  stepLabels: { intro: 'Задача', octave: 'Октава', count: 'Півтони', gaps: 'Краї', walk: 'Круг', guitar: 'Гітара', complete: 'Підсумок' },
  preferences: lessonTwoContent.preferences,
  keyRowLabel: 'Ряд клавіш',
  colors: { white: 'біла', black: 'чорна' },
  keyLabel: (key: number, color: string, frequency: string, spokenNames: readonly string[]) => `Клавіша ${key}${spokenNames.length ? `, ${spokenNames.join(' або ')}` : ''}, ${color}, ${frequency} Гц`,
  intro: {
    title: 'Що ти вже вмієш',
    reminder: lessonNineContent.complete.bridge,
    instruction: 'Ти пройшов шлях від безлічі частот до 12 клавіш і їхніх назв. Тепер покажи це сам: чотири короткі задачі. Нічого нового тут не буде.',
    tasksTitle: 'Що зробимо',
    tasks: [
      { title: 'Октава', text: 'Знайдеш звук на октаву вище й нижче для нової частоти.' },
      { title: 'Півтони', text: 'Порахуєш півтони й тони між двома названими клавішами.' },
      { title: 'Краї', text: 'Знайдеш обидві пари білих клавіш без чорної між ними.' },
      { title: 'Круг', text: 'Пройдеш дванадцять півтонів і назвеш кожен крок.' },
    ],
    prediction: {
      question: 'Що, на твою думку, станеться після 12 півтонів?',
      choices: [
        { id: 'same', label: 'Та сама назва, але вище', feedback: 'Перевір це сам на кроці «Круг».' },
        { id: 'new', label: 'Нова назва', feedback: 'Перевір це сам на кроці «Круг».' },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого страшного: далі спробуєш сам.' },
      ],
      correctChoiceId: 'same',
    },
    nextLabel: 'Далі',
  },
  octave: {
    title: 'Октава для нової частоти',
    instruction: 'Знайди звук на октаву вище або нижче. Введи число в герцах.',
    inputLabel: 'Частота, Гц',
    taskLabel: (task: OctaveTask) => `${task.direction === 'up' ? 'Октава вище' : 'Октава нижче'} від ${task.frequency} Гц`,
    checkLabel: 'Перевірити',
    showLabel: 'Показати відповідь',
    right: 'Так.',
    wrong: 'Ще ні. Октава — це подвоєння або поділ навпіл.',
    empty: 'Введи число.',
    range: (min: number, max: number) => `Цей урок працює з частотами від ${min} до ${max} Гц. Введи число з цього діапазону.`,
    shown: (frequency: number) => `Відповідь: ${frequency} Гц.`,
    listenLabel: (given: number, answer: number) => `Послухати ${given} Гц і ${answer} Гц`,
    stopLabel: 'Зупинити',
    withoutAudio: 'Без звуку: перевір числа — вища октава вдвічі більша, нижча вдвічі менша.',
    solvedStatus: (done: number, total: number) => `Розв’язано ${done} із ${total}.`,
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  count: {
    title: 'Скільки півтонів',
    instruction: 'Порахуй, скільки півтонів від першої клавіші до другої вгору, і скільки це тонів.',
    taskLabel: (task: CountTask) => `Від ${task.from} до ${task.to}`,
    semitonesLabel: 'Півтонів',
    tonesLabel: 'Тонів (можна з комою)',
    checkLabel: 'Перевірити',
    showLabel: 'Показати відповідь',
    right: 'Так.',
    wrong: 'Ще ні. Порахуй кроки по клавішах, чорні теж рахуються.',
    empty: 'Введи обидва числа.',
    shown: (semitones: number, tones: number) => `Відповідь: ${semitones} півтонів, ${String(tones).replace('.', ',')} тонів.`,
    keyRowCaption: 'Підказка: ось ряд клавіш. Рахуй кроки по ньому.',
    withoutAudio: 'Цей крок можна пройти без звуку.',
    solvedStatus: (done: number, total: number) => `Розв’язано ${done} із ${total}.`,
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  gaps: {
    title: 'Де немає чорної',
    instruction: 'Ось сім білих клавіш і верхня C. Познач усі пари сусідніх білих клавіш, між якими немає чорної.',
    pairLabel: (from: string, to: string) => `${from}–${to}`,
    checkLabel: 'Перевірити',
    right: 'Так, ці дві пари.',
    wrong: 'Ще ні. Придивись, між якими білими клавішами чорної не видно.',
    explain: {
      question: 'Чому саме вони?',
      choices: [
        { id: 'one', label: 'Між ними лише один півтон', feedback: 'Так: чорної клавіші між ними немає, тож крок найкоротший.' },
        { id: 'close', label: 'Вони найближчі за частотою', feedback: 'Ні: в усіх парах сусідні клавіші різняться на півтон або на два.' },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого страшного: порахуй півтони в кожній парі.' },
      ],
      correctChoiceId: 'one',
    },
    recall: 'Пригадай E♯. Яка це клавіша? Відповідь: F, це якраз пара E–F.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  walk: {
    title: 'Дванадцять кроків',
    instruction: 'Обери білу клавішу й іди вгору по півтону. На кожному кроці назви клавішу.',
    startLabel: 'Початок',
    startGroupLabel: 'Початкова клавіша',
    stepLabel: 'Крок вгору',
    nameGroupLabel: 'Назва клавіші',
    letterLabel: 'Літера',
    signLabel: 'Знак',
    signs: [{ id: '', label: 'без знака', spoken: 'без знака' }, { id: '♯', label: '♯', spoken: 'дієз' }, { id: '♭', label: '♭', spoken: 'бемоль' }],
    checkLabel: 'Назвати',
    progress: (step: number, total: number) => `Крок ${step} із ${total}`,
    current: (frequency: string) => `Частота: ${frequency}`,
    right: (names: readonly string[]) => `Так: ${names.join(' або ')}.`,
    hint: (step: number) => `Ще ні. Це ${step}-й півтон від початку, порахуй клавіші по ряду.`,
    finished: (startName: string, startHertz: string, endHertz: string) => `Через 12 півтонів — знову ${startName}. Частота була ${startHertz}, стала ${endHertz}: рівно вдвічі більше, відношення 2 до 1.`,
    prediction: (label: string) => `Твій прогноз на початку: «${label}».`,
    pattern: {
      question: 'Яке речення тут найкраще підсумовує побачене?',
      choices: [
        { id: 'octave', label: 'Через 12 півтонів — та сама назва, звук вдвічі вищий.', feedback: 'Так: дванадцять півтонів — це одна октава.' },
        { id: 'new', label: 'Через 12 півтонів з’являється нова назва.', feedback: 'Ні: назва повернулася до початкової.' },
        { id: 'same', label: 'Через 12 півтонів звук не змінюється.', feedback: 'Ні: частота виросла вдвічі, звук вищий.' },
      ],
      correctChoiceId: 'octave',
    },
    otherLabel: 'Інший початок',
    listenLabel: 'Послухати весь круг',
    stopLabel: 'Зупинити',
    withoutAudio: 'Без звуку: стеж за частотами під клавішами.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  guitar: {
    title: 'Октава на слух',
    instruction: 'Порівняй відкриту струну зі звуком на октаву вище.',
    experiment: {
      title: 'Струна й звук на октаву вище',
      withGuitar: 'Смикни відкриту струну, яка звучить на 110 Гц, а потім натисни «Послухати 220 Гц» і порівняй обидва звуки.',
      withoutGuitar: 'Натисни «Послухати 110 Гц», а потім «Послухати 220 Гц» й порівняй.',
      safety: 'Смикай м’яко, подушечкою пальця.',
    },
    listenString: 'Послухати 110 Гц',
    listenOctave: 'Послухати 220 Гц',
    question: 'Звук такий самий, але вищий? Що ти помітив?',
    note: 'Відповіді тут не оцінюються.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  complete: {
    title: 'Етап II зібрано',
    summaryTitle: 'Весь шлях',
    chain: 'Безліч частот → обрана система з 12 кроків → октава (×2) → півтон → 7 назв і знаки → дванадцять кроків повертають до тієї самої назви.',
    abilitiesTitle: 'Що тепер умієш',
    abilities: [
      'Знайти октаву для будь-якої частоти: помножити на 2 або поділити на 2.',
      'Порахувати півтони й тони між двома клавішами, зокрема з ♯ і ♭.',
      'Знайти обидві пари білих клавіш без чорної й пояснити чому.',
      'Пройти 12 півтонів і прийти до тієї самої назви, але вдвічі вищої.',
    ],
    answer: 'Ноти — не безліч частот, а обрана система з 12 рівних кроків на октаву, що повторюється.',
    finishLabel: 'Завершити етап II',
    finished: 'Етап II завершено.',
    feedback: 'Ти сам перевірив усе, що відкрив на цьому етапі.',
    bridgeTitle: 'Наступне питання',
    bridge: 'Ти знаєш, що таке півтон. На гітарі один такий крок — це що саме?',
    bridgeNote: 'Подумай своїми словами: наступного уроку поки немає. Відповіді тут не оцінюються.',
    backToCourse: 'До курсу',
    backLabel: 'Назад',
  },
} as const;
