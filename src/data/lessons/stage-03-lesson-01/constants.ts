import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonTenContent } from '@/data/lessons/stage-02-lesson-05/constants';
import type { FretNote } from '@/data/lessons/stage-03-lesson-01-model/types';
import { fifthString, sharpNames } from '@/data/lessons/stage-03-lesson-01-model/constants';
import { fretFrequency, hertz, noteAtFret } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';

// Frets heard on `press`, and the two the learner must hear before the pattern question.
export const pressFrets: readonly number[] = [0, 1, 2, 3];
export const requiredPressFrets: readonly number[] = [1, 2];

// Frets of the guitar step, the same as on the real instrument.
export const guitarFrets: readonly number[] = [0, 1, 2, 3, 12];

// Fixed tasks of the explorer's «predict» mode and of the checkpoint.
export const predictFrets: readonly number[] = [3, 7, 10];
export const checkpointNoteFret = 7;
export const checkpointFindNote: FretNote = 'D';

const open = fifthString.frequency;
const noteChoices = (correct: string, explain: (name: string) => string) => sharpNames.map((name) => ({ id: name, label: name, feedback: name === correct ? explain(name) : `Ні: ${explain(correct)}` }));

export const lessonElevenContent = {
  id: 'stage-03-lesson-01',
  stageLabel: 'Етап III · Гриф',
  title: 'Що робить один лад?',
  estimatedTime: '12–16 хв',
  stepLabels: { intro: 'Питання', press: 'Лад за ладом', twelve: '12-й лад', explorer: 'Дослідник', guitar: 'Гітара', checkpoint: 'Перевірка', complete: 'Підсумок' },
  preferences: lessonTwoContent.preferences,
  keyRowLabel: 'Ряд клавіш від відкритої струни',
  stringName: fifthString.name,
  fretLabel: (fret: number) => (fret === 0 ? 'відкрита струна' : `лад ${fret}`),
  fretSummary: (fret: number, note: string, frequency: number) => `${fret === 0 ? 'відкрита струна' : `лад ${fret}`}, ${fret} ${fret === 1 ? 'півтон' : fret >= 2 && fret <= 4 ? 'півтони' : 'півтонів'}, нота ${note}, ${hertz(frequency)}`,
  board: {
    label: (stringName: string) => `Гриф: ${stringName}, відкрита струна і лади від 1 до 12`,
    picker: 'Вибір лада',
    previous: 'Лад −1',
    next: 'Лад +1',
    openShort: '0',
    lengthTitle: 'Звучна частина струни',
    lengthText: (fraction: string) => `Звучить ${fraction} довжини струни`,
    selected: (fret: number) => `Вибрано: ${fret === 0 ? 'відкрита струна' : `лад ${fret}`}`,
  },
  keyLabel: (key: number, frequency: string) => `Клавіша ${key}, ${frequency} Гц`,
  intro: {
    title: 'Що змінює порожок?',
    reminder: lessonTenContent.complete.bridge,
    instruction: 'Подивись на схему однієї струни. Порожки на грифі називають ладами. Спочатку послухай відкриту струну — вона теж має номер, це «0».',
    listenLabel: 'Послухати відкриту струну',
    stopLabel: 'Зупинити',
    withoutAudio: `Без звуку: відкрита 5-та струна звучить на ${hertz(open)}. Далі кожен крок має опис словами й числа.`,
    prediction: {
      question: 'Що станеться зі звуком, якщо притиснути струну біля першого порожка?',
      choices: [
        { id: 'higher', label: 'Стане вищим', feedback: 'Перевір це на наступному кроці.' },
        { id: 'lower', label: 'Стане нижчим', feedback: 'Перевір це на наступному кроці.' },
        { id: 'same', label: 'Лишиться тим самим', feedback: 'Перевір це на наступному кроці.' },
      ],
      correctChoiceId: 'higher',
    },
    nextLabel: 'Далі',
  },
  press: {
    title: 'Лад за ладом',
    instruction: 'Притискай струну на ладах 1, 2 і 3 і слухай, як змінюється звук.',
    prediction: {
      question: 'Лад 1 підняв звук. Що зробить лад 2 порівняно з ладом 1?',
      choices: [
        { id: 'same-step', label: 'Підніме ще на такий самий крок', feedback: 'Перевір сам: послухай лади по черзі.' },
        { id: 'bigger', label: 'Підніме на більший крок', feedback: 'Перевір сам: послухай лади по черзі.' },
        { id: 'none', label: 'Не змінить звук', feedback: 'Перевір сам: послухай лади по черзі.' },
      ],
      correctChoiceId: 'same-step',
    },
    task: 'Вибери лад 1, 2 і 3. Поруч — ряд клавіш із етапу II: кожному ладу відповідає своя клавіша.',
    counter: (fret: number) => `Півтонів від відкритої струни: ${fret}`,
    withoutAudio: `Без звуку: частоти ладів 0, 1, 2, 3 — ${pressFrets.map((fret) => hertz(fretFrequency(open, fret))).join(', ')}. Крок між сусідніми однаковий, як між сусідніми клавішами.`,
    heardStatus: (count: number) => `Перевірено ладів: ${count} з ${requiredPressFrets.length} потрібних (1 і 2).`,
    patternQuestion: {
      question: 'Що робить кожен наступний лад?',
      choices: [
        { id: 'semitone', label: 'Піднімає звук на півтон', feedback: 'Так: кожен лад — це один півтон, як сусідня клавіша.' },
        { id: 'tone', label: 'Піднімає звук на тон', feedback: 'Ні: тон — це два півтони, а лад дав один.' },
        { id: 'uneven', label: 'Піднімає по-різному', feedback: 'Ні: кроки між ладами рівні, як між сусідніми клавішами.' },
      ],
      correctChoiceId: 'semitone',
    },
    pattern: 'Лад = один півтон. Кожен порожок ставить струну на наступну клавішу ряду.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  twelve: {
    title: 'Чому 12-й лад особливий?',
    instruction: 'Якщо кожен лад — це півтон, на якому ладі звук стане «тим самим, що й відкрита струна, але вищим»?',
    prediction: {
      question: 'На якому ладі, на твою думку, це станеться?',
      choices: [
        { id: '7', label: 'На 7-му', feedback: 'Перевір сам на схемі й на слух.' },
        { id: '10', label: 'На 10-му', feedback: 'Перевір сам на схемі й на слух.' },
        { id: '12', label: 'На 12-му', feedback: 'Перевір сам на схемі й на слух.' },
        { id: '24', label: 'На 24-му', feedback: 'Перевір сам на схемі й на слух.' },
      ],
      correctChoiceId: '12',
    },
    task: 'Вибери 12-й лад. Послухай відкриту струну, а потім 12-й лад.',
    playOpen: `Відкрита струна, ${hertz(open)}`,
    playTwelve: `12-й лад, ${hertz(fretFrequency(open, 12))}`,
    ratio: `${hertz(open)} → ${hertz(fretFrequency(open, 12))}: ×2`,
    withoutAudio: `Без звуку: на 12-му ладі частота ${hertz(fretFrequency(open, 12))}, удвічі більша за ${hertz(open)}.`,
    lengthSummary: (fraction: string) => `Частка довжини, що звучить: ${fraction}`,
    pattern: 'Звук вдвічі вищий — струна вдвічі коротша. 12-й лад — це октава: 12 півтонів.',
    reminder: 'Згадай струну з етапу I: коротша струна звучить вище.',
    question: {
      question: 'Яка нота на 12-му ладі 5-ї струни?',
      choices: [
        { id: 'A', label: 'A — та сама, що відкрита, але вища', feedback: 'Так: 12 півтонів — це октава, назва нота та сама.' },
        { id: 'A♯', label: 'A♯', feedback: 'Ні: A♯ — на один лад вище за відкриту струну.' },
        { id: 'other', label: 'Зовсім інша нота', feedback: 'Ні: через 12 півтонів повертається та сама назва.' },
      ],
      correctChoiceId: 'A',
    },
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  explorer: {
    title: 'Дослідник ладів',
    instruction: 'Рухайся по ладах 0–12 і дивись, як лад, півтони, нота та частота йдуть разом.',
    modes: { explore: 'Дослідь', predict: 'Спробуй передбачити' },
    modeLabel: 'Режим',
    fretLabel: 'Лад',
    semitonesLabel: 'Півтонів від відкритої',
    noteLabel: 'Нота',
    frequencyLabel: 'Частота',
    play: 'Послухати',
    exploreHint: (openNote: string) => `Нота ладу — це відкрита нота ${openNote}, зсунута на стільки півтонів, скільки номер лада. Імена йдуть так само, як на клавішах етапу II.`,
    withoutAudio: 'Без звуку: дивись на ноту й число частоти.',
    startPredict: 'Далі до передбачень',
    predictTitle: 'Передбач ноту',
    predictQuestion: (fret: number) => `Яка нота на ладі ${fret}?`,
    predictPrompt: (done: number, total: number) => `Розв’язано: ${done} з ${total}.`,
    explain: (fret: number, note: string, openNote: string) => `Лад ${fret} — ${fret} півтонів від ${openNote}: це ${note}.`,
    nextTask: 'Наступне завдання',
    stepDown: 'Лад −1',
    stepUp: 'Лад +1',
    rule: 'Ноту на ладі не заучують: від відкритої струни йдуть по півтонах.',
    tableTitle: 'Усі ноти ладів',
    tableRow: (fret: number, note: string) => `Лад ${fret}: ${note}`,
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  guitar: {
    title: 'На справжній гітарі',
    instruction: 'Зроби те саме на справжній 5-й струні.',
    experiment: {
      title: 'Лади на 5-й струні',
      withGuitar: 'Смикни відкриту 5-ту струну. Притисни її біля ладів 1, 2 і 3 — по одному — і слухай. Потім притисни біля 12-го ладу й порівняй із відкритою струною. Ще раз легко торкнися струни над 12-м ладом, не притискаючи, і порівняй звук.',
      withoutGuitar: 'Без гітари: натискай кнопки нижче й слухай лади 0, 1, 2, 3 і 12. Порівняй 12-й лад із відкритою струною.',
      safety: 'Притискай струну пальцем біля порожка, не сильно. Якщо болить — зроби паузу.',
    },
    listen: (fret: number) => (fret === 0 ? 'Відкрита струна' : `Лад ${fret}`),
    question: 'Чи збігається те, що ти чуєш на гітарі, з тим, що було на схемі?',
    note: 'Відповіді тут не оцінюються: це твоє спостереження.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  checkpoint: {
    title: 'Перевір себе',
    instruction: 'Три короткі завдання. Помилка не карається: у кожної відповіді є пояснення.',
    noteTask: {
      title: 'Завдання 1. Нота на ладі',
      question: `Яка нота на ладі ${checkpointNoteFret} 5-ї струни?`,
      choices: noteChoices(noteAtFret(fifthString.openKey, checkpointNoteFret), (name) => `Лад ${checkpointNoteFret} — ${checkpointNoteFret} півтонів від ${fifthString.openNote}: це ${name}.`),
      correctChoiceId: noteAtFret(fifthString.openKey, checkpointNoteFret),
    },
    findTask: {
      title: 'Завдання 2. Лад для ноти',
      question: `Вибери лад, на якому на 5-й струні звучить нота ${checkpointFindNote}.`,
      check: 'Перевірити',
      right: (fret: number) => `Так: лад ${fret} — ${fret} півтонів від ${fifthString.openNote}, це ${checkpointFindNote}.`,
      wrong: (fret: number, note: string) => `Лад ${fret} — це ${note}. Порахуй півтони від ${fifthString.openNote} до ${checkpointFindNote}.`,
    },
    twelveTask: {
      title: 'Завдання 3. 12-й лад',
      question: 'Чому 12-й лад звучить як відкрита струна, але вище?',
      choices: [
        { id: 'octave', label: 'Бо це 12 півтонів, тобто октава, а звучна частина вдвічі коротша', feedback: 'Так: 12 півтонів — октава, а вдвічі вища частота — це вдвічі коротша струна.' },
        { id: 'tone', label: 'Бо 12-й лад — найближчий до кобилки', feedback: 'Ні: справа в 12 півтонах і половині довжини, а не в близькості до кінця.' },
        { id: 'same', label: 'Бо кожен лад дає ту саму ноту', feedback: 'Ні: кожен лад дає на півтон вище, а та сама нота повертається лише через 12.' },
      ],
      correctChoiceId: 'octave',
    },
    solvedStatus: (count: number) => `Розв’язано: ${count} з 3.`,
    passed: 'Усі три завдання розв’язано.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  complete: {
    title: 'Підсумок',
    summaryTitle: 'Що ти відкрив',
    summary: [
      'Лад — це один півтон.',
      '12 ладів — це октава: та сама нота, але вища, а звучна частина вдвічі коротша.',
      'Ноту на ладі знаходять рахунком півтонів від відкритої струни.',
    ],
    finishLabel: 'Завершити урок',
    finished: 'Урок завершено.',
    feedback: 'Ти сам знайшов, що робить лад і чому 12-й особливий.',
    bridgeTitle: 'Наступне питання',
    bridge: 'Ми дослідили одну струну. Але на гітарі їх шість. Як вони налаштовані одна відносно іншої, і чому відстані між ними не однакові?',
    bridgeNote: 'Подумай своїми словами. Відповіді тут не оцінюються.',
    backLabel: 'Назад',
    backToCourse: 'До курсу',
  },
};
