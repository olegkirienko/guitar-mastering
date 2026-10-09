import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';
import { keyOfA, noteNames, noteSyllables } from '@/data/lessons/stage-02-lesson-03-model/constants';
import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';
import { keyOfName, noteNameOf, shiftWhite, whiteKeys } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';

// Keys of the sequences on `intro`: all thirteen, then the white ones only.
export const introAllKeys: readonly number[] = Array.from({ length: 13 }, (_, key) => key);
export const introWhiteKeys: readonly number[] = whiteKeys(0, 12);

// Whites to find on `pattern`, and pairs to size, before the screen counts as done.
export const requiredWhiteKeys = 7;
export const requiredPairs = 4;

// The name of a white key; the lesson never names a black one.
function nameOf(name: NoteName | null): NoteName {
  if (name === null) throw new Error('A task landed on a black key');
  return name;
}

function letterChoices(correct: NoteName, explanation: string) {
  return noteNames.map((name) => ({ id: name, label: name, feedback: name === correct ? explanation : `Ні: ${explanation}` }));
}

const taskKey = 7;
const taskKeyName = nameOf(noteNameOf(taskKey));
const sevenAboveC = nameOf(shiftWhite('C', 7));
const fourBelowA = nameOf(shiftWhite('A', -4));
export const anchorShifts = [2, 5] as const;
const anchorNames = anchorShifts.map((shift) => nameOf(shiftWhite('A', shift)));

// Stage II lesson 3 gives the letters only on `names`; before that the content says «біла клавіша».
export const lessonEightContent = {
  id: 'stage-02-lesson-03',
  stageLabel: 'Етап II · Музична система',
  title: 'Сім основних назв',
  estimatedTime: '12–15 хв',
  stepLabels: { intro: 'Лише білі', look: 'Візерунок', pattern: 'Відстані', names: 'Назви', anchor: 'Привʼязка', guitar: 'Гітара', checkpoint: 'Перевірка', complete: 'Підсумок' },
  preferences: lessonTwoContent.preferences,
  keyRowLabel: 'Ряд клавіш',
  keyLabel: (key: number, color: string, frequency: string, name: string | null) => `Клавіша ${key}${name ? `, ${name}` : ''}, ${color}, ${frequency} Гц`,
  colors: { white: 'біла', black: 'чорна' },
  intro: {
    title: 'Лише білі',
    reminder: lessonSevenContent.complete.bridge,
    instruction: 'Послухай тринадцять клавіш підряд, а потім лише білі. Відповідей тут не оцінюємо.',
    allLabel: 'Усі клавіші підряд',
    whiteLabel: 'Лише білі',
    stopLabel: 'Зупинити',
    listenNote: 'Без звуку: уяви ряд з тринадцяти клавіш. У другому прикладі чорні клавіші пропущено.',
    question: 'Що змінилося: кроки здаються однаковими чи ні? Який із прикладів нагадує мелодію, яку ти знаєш?',
    discovery: 'Музика називає не всі дванадцять звуків, а лише частину, і ставить їх у візерунок. У який?',
    nextLabel: 'Далі',
  },
  look: {
    title: 'Візерунок на клавішах',
    instruction: 'Тисни клавіші й дивись, як чорні стоять поруч.',
    task: 'Знайди місця, де чорні клавіші стоять парою, і де трійкою. Відповідь не оцінюється.',
    pressedStatus: (count: number) => `Натиснуто клавіш: ${count}.`,
    landmark: 'Біла клавіша ліворуч від пари чорних — клавіша 0. З неї ми починаємо ряд і цього разу.',
    pattern: 'Пара, трійка, пара, трійка: візерунок повторюється. Чому він такий — з’ясуємо далі.',
    withoutAudio: 'Без звуку: подивися на ряд. Клавіші 1 і 3 чорні й стоять парою, 6, 8 і 10 — трійкою.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  pattern: {
    title: 'Скільки білих і які відстані',
    instruction: 'Спершу прогноз, потім слух і підрахунок.',
    prediction: {
      question: 'Скільки білих клавіш від клавіші 0 до наступної такої самої, не рахуючи наступну?',
      choices: [
        { id: '5', label: '5', feedback: 'Перевір сам: тисни білі клавіші й рахуй.' },
        { id: '7', label: '7', feedback: 'Перевір сам: тисни білі клавіші й рахуй.' },
        { id: '8', label: '8', feedback: 'Перевір сам: тисни білі клавіші й рахуй.' },
        { id: '12', label: '12', feedback: 'Перевір сам: тисни білі клавіші й рахуй.' },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого страшного: порахуєш сам.' },
      ],
      correctChoiceId: '7',
    },
    countTask: 'Тисни лише білі клавіші від 0 до 11 і рахуй їх.',
    countStatus: (count: number) => `Білих клавіш знайдено: ${count}.`,
    whiteKeyOnly: 'Це чорна клавіша. Тисни лише білі.',
    withoutAudio: 'Без звуку: білі клавіші — 0, 2, 4, 5, 7, 9, 11. Клавіша 12 — вже повторна.',
    pairsTitle: 'Скільки півтонів між сусідніми білими?',
    pairsInstruction: 'Для кожної пари вибери: один півтон чи два. Хоча б чотири пари — і візерунок видно.',
    pairs: {
      caption: 'Пари сусідніх білих клавіш',
      pairLabel: (from: number, to: number) => `Клавіші ${from} і ${to}`,
      listenLabel: 'Послухати пару',
      stopLabel: 'Зупинити',
      options: [{ semitones: 1, label: '1 півтон' }, { semitones: 2, label: '2 півтони' }],
      right: 'Так.',
      wrong: 'Ні: порахуй клавіші між ними, чорні теж рахуються.',
      headers: { pair: 'Пара', answer: 'Відповідь' },
    },
    revealLabel: 'Показати відповіді',
    sequenceTitle: 'Відстані по порядку',
    sequence: '2 · 2 · 1 · 2 · 2 · 2 · 1',
    observation: 'Там, де між білими немає чорної, крок вдвічі менший. Таких пар дві: кроки йдуть як 2-2 · 1 · 2-2-2 · 1. Півтон стоїть там, де закінчується група з двох чорних і де закінчується група з трьох.',
    question: 'Чому чорної немає саме у двох місцях? Музичну систему так розставили, і ми вчимося її читати.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  names: {
    title: 'Сім назв',
    instruction: 'Білі клавіші мають сім основних назв. Тисни білі клавіші й відкривай назви по одній.',
    term: `Назви білих клавіш: ${noteNames.join(' ')} (${noteSyllables.join(' ')}). Це два способи записати ті самі сім назв.`,
    task: 'Тисни білі клавіші від 0 до 12 і дивись, яка літера над кожною з’являється.',
    revealedStatus: (count: number) => `Відкрито назв: ${count}.`,
    syllableLabel: (name: string, syllable: string) => `${name} — ${syllable}`,
    blackNote: 'Назву чорної клавіші дізнаємось у наступному уроці.',
    blackButton: 'А чорні?',
    repeat: 'Після B назви починаються знову: клавіша 12 — теж C, «той самий» звук, лише вищий (урок 1).',
    pairsNote: 'Пари білих без чорної між ними — це E–F і B–C. Це те саме, що ти знайшов на попередньому кроці, тепер із літерами.',
    landmark: 'Орієнтир: C — біла клавіша ліворуч від пари чорних. Це договір, а не закон природи.',
    question: {
      question: 'Яка літера йде після B?',
      choices: [
        { id: 'C', label: 'C', feedback: 'Так: після B назви починаються знову, з C.' },
        { id: 'A', label: 'A', feedback: 'A стоїть перед B. Після B ряд починається знову.' },
        { id: 'H', label: 'H', feedback: 'Такої літери в нашому ряду немає: їх лише сім.' },
      ],
      correctChoiceId: 'C',
    },
    withoutAudio: 'Без звуку: над клавішами з’являються літери за порядком C D E F G A B C.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  anchor: {
    title: 'Привʼязка до 440 Гц',
    instruction: 'У першому етапі ти чув A = 440 Гц. Тепер знайди цю клавішу в ряду.',
    reminder: `Клавіша ${keyOfA} звучить 440 Гц — це A (ля). Двічі нижче — 220 Гц, ще двічі нижче — 110 Гц: це теж A.`,
    findTask: 'Знайди клавішу A і натисни її.',
    questionsTitle: 'Рахуй півтони від A',
    questions: anchorShifts.map((shift, index) => ({
      id: `shift-${shift}`,
      question: `Яка біла клавіша на ${shift} ${shift === 2 ? 'півтони' : 'півтонів'} вище за A?`,
      choices: letterChoices(anchorNames[index], `A + ${shift} півтонів — це ${anchorNames[index]}.`),
      correctChoiceId: anchorNames[index],
    })),
    note: 'Назва літерою не залежить від того, у якій октаві клавіша; частота залежить: A може бути 110, 220 або 440 Гц.',
    withoutAudio: 'Без звуку: A — клавіша 9 (440 Гц), а наступна A була б 880 Гц.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  guitar: {
    title: 'Звуки з назвами',
    instruction: 'Порівняй звук струни зі звуком клавіші з тією самою частотою.',
    experiment: {
      title: 'Відкрита струна й клавіша A',
      withGuitar: 'Смикни відкриту струну, яка звучить на 110 Гц, і послухай. Потім натисни «Послухати клавішу A» й порівняй звуки.',
      withoutGuitar: 'Натисни «Послухати струну 110 Гц», а потім «Послухати клавішу A» й порівняй.',
      safety: 'Смикай м’яко, подушечкою пальця.',
    },
    listenString: 'Послухати струну 110 Гц',
    listenKey: 'Послухати клавішу A',
    question: 'Чим звук струни схожий на звук клавіші A і чим відрізняється?',
    note: 'Відповіді тут не оцінюються: назви — спільна мова, а не вигадка клавіатури.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  checkpoint: {
    title: 'Назви й відстані',
    instruction: 'Чотири завдання. Помилка не карається: кожна відповідь має пояснення.',
    solved: 'Усі завдання виконано.',
    tasks: [
      {
        id: 'name',
        question: 'Яка літера в підсвіченої білої клавіші?',
        choices: letterChoices(taskKeyName, `Порахуй білі від C (клавіша ${keyOfName('C')}): ${noteNames.slice(0, noteNames.indexOf(taskKeyName) + 1).join(', ')}.`),
        correctChoiceId: taskKeyName,
        highlightKey: taskKey,
      },
      {
        id: 'pair',
        question: 'У якій парі між білими клавішами лише один півтон?',
        choices: [
          { id: 'CD', label: 'C і D', feedback: 'Між C і D є чорна клавіша, тож це два півтони.' },
          { id: 'EF', label: 'E і F', feedback: 'Так: між E і F чорної немає, це один півтон.' },
          { id: 'DE', label: 'D і E', feedback: 'Між D і E є чорна клавіша, тож це два півтони.' },
        ],
        correctChoiceId: 'EF',
      },
      {
        id: 'up',
        question: 'Яка літера на 7 півтонів вище за C?',
        choices: letterChoices(sevenAboveC, `C + 7 півтонів — це ${sevenAboveC}.`),
        correctChoiceId: sevenAboveC,
      },
      {
        id: 'down',
        question: 'Яка літера на 4 півтони нижче за A?',
        choices: letterChoices(fourBelowA, `A − 4 півтони — це ${fourBelowA}.`),
        correctChoiceId: fourBelowA,
      },
    ],
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  complete: {
    title: 'Підсумок',
    summaryTitle: 'Що ти знайшов',
    summary: [
      'На білих клавішах сім назв: C D E F G A B, а після B знову C на октаву вище.',
      'Пари білих без чорної між ними — це півтон, інші білі пари — тон.',
      'Клавіша A звучить 440 Гц.',
    ],
    finishLabel: 'Завершити урок',
    finished: 'Урок завершено.',
    feedback: 'Ти сам знайшов візерунок, а потім отримав для нього назви.',
    bridgeTitle: 'Наступне питання',
    bridge: 'Між C і D є чорна клавіша. Яку назву вона має — і чому в неї може бути дві?',
    bridgeNote: 'Подумай своїми словами: відповідь буде в наступному уроці.',
    backToCourse: 'До курсу',
    backLabel: 'Назад',
  },
} as const;

