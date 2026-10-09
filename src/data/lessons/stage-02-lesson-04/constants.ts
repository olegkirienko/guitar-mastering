import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonEightContent } from '@/data/lessons/stage-02-lesson-03/constants';
import { baseFrequency, keyOfA, noteNames, noteSyllables } from '@/data/lessons/stage-02-lesson-03-model/constants';
import type { NoteName } from '@/data/lessons/stage-02-lesson-03-model/types';
import { flatSign, lettersWithFlat, lettersWithSharp, naturalSign, sharpSign } from '@/data/lessons/stage-02-lesson-04-model/constants';
import { areEnharmonic, keyOfSpelledName, namesOfKey, whiteLetterOf } from '@/data/lessons/stage-02-lesson-04-model/utils/names';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';

// The black key between C and D, and its frequency shown to one decimal.
export const middleBlackKey = 1;
const hertz = (frequency: number) => `${frequency.toFixed(1).replace('.', ',')} Гц`;
export const middleBlackHertz = hertz(keyFrequency(baseFrequency, middleBlackKey));

// Sharps found before the screen is a done one (the learner may also press «Далі»).
export const requiredSharps = 3;

// Keys of the two sequences on `intro`: white only, then through the black key.
export const introWhiteKeys: readonly number[] = [0, 2];
export const introThroughBlackKeys: readonly number[] = [0, middleBlackKey, 2];

// Left names to join with the right ones on `same`; the right column is shuffled on purpose.
export const sharpPairs = ['D♯', 'F♯', 'G♯', 'A♯'] as const;
export const flatPairs = ['G♭', 'B♭', 'E♭', 'A♭'] as const;

// The four cases of `edges`: a sign that lands on a white key.
export const edgeCases = ['E♯', 'B♯', 'F♭', 'C♭'] as const;

// The string and the semitone above it, an octave below the keyboard's A and A♯.
export const guitarStringHertz = 110;
export const guitarSemitoneKey = keyOfA + 1;
export const guitarSemitoneFrequency = keyFrequency(baseFrequency, guitarSemitoneKey) / 4;

// The pairs of `checkpoint` task 3: answers are split evenly between «same» and «different».
export const checkpointPairs = [['A♯', 'B♭'], ['C♯', 'E♭'], ['D♯', 'E♭'], ['G♭', 'G♯']] as const;
export const checkpointKey = 6;
export const checkpointFindName = 'G♭';

function nameOf(name: NoteName | null): NoteName {
  if (name === null) throw new Error('A task landed on a black key');
  return name;
}

function letterChoices(correct: NoteName, explanation: string) {
  return noteNames.map((name) => ({ id: name, label: name, feedback: name === correct ? explanation : `Ні: ${explanation}` }));
}

const syllable = (letter: NoteName) => noteSyllables[noteNames.indexOf(letter)];
// «C♯» spoken in a sentence: «до-дієз».
const sharpWord = (letter: NoteName) => `${syllable(letter)}-дієз`;
const flatWord = (letter: NoteName) => `${syllable(letter)}-бемоль`;

const edgeLetters = Object.fromEntries(edgeCases.map((name) => [name, nameOf(whiteLetterOf(name))])) as Record<(typeof edgeCases)[number], NoteName>;
const sharpEdge = nameOf(whiteLetterOf('B♯'));
const checkpointNames = namesOfKey(checkpointKey);
const keyAnswerNames = ['F♯', 'G♭', 'G♯', 'E♭'];

// Stage II lesson 4 gives `♯` on `raise`, `♭` on `lower`, «енгармонічні» and «рівномірний стрій» on `same`, `♮` on `edges`.
export const lessonNineContent = {
  id: 'stage-02-lesson-04',
  stageLabel: 'Етап II · Музична система',
  title: 'Дієз і бемоль',
  estimatedTime: '13–16 хв',
  stepLabels: { intro: 'Звук без літери', raise: 'Дієз', lower: 'Бемоль', same: 'Дві назви', edges: 'Краї', guitar: 'Гітара', checkpoint: 'Перевірка', complete: 'Підсумок' },
  preferences: lessonTwoContent.preferences,
  keyRowLabel: 'Ряд клавіш',
  colors: { white: 'біла', black: 'чорна' },
  keyLabel: (key: number, color: string, frequency: string, spokenNames: readonly string[]) => `Клавіша ${key}${spokenNames.length ? `, ${spokenNames.join(' або ')}` : ''}, ${color}, ${frequency} Гц`,
  intro: {
    title: 'Звук без літери',
    reminder: lessonEightContent.complete.bridge,
    instruction: 'Послухай два приклади: від C до D лише білими клавішами, а потім із чорною клавішею між ними. Відповідей тут не оцінюємо.',
    whiteLabel: 'C → D лише білі',
    blackLabel: 'C → чорна → D',
    stopLabel: 'Зупинити',
    listenNote: 'Без звуку: подивися на клавіші 0, 1 і 2. Між C і D стоїть чорна клавіша 1, і вона теж звучить.',
    keysTask: 'Клавіша 1 чорна. Натисни її й порівняй із сусідами.',
    prediction: {
      question: 'Як назвати середній звук, клавішу 1?',
      choices: [
        { id: 'letter', label: 'Новою літерою, наприклад H', feedback: 'Перевір далі: чи вистачить літер.' },
        { id: 'neighbours', label: 'Назвою від сусідів — C і D', feedback: 'Перевір далі: як саме назва може йти від сусіда.' },
        { id: 'number', label: 'Просто «клавіша 1»', feedback: 'Перевір далі: чи зручно так називати кожен звук.' },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого страшного: далі спробуєш сам.' },
      ],
      correctChoiceId: 'neighbours',
    },
    discovery: 'Літер лише сім, а звуків дванадцять, тож п’ятьом чорним клавішам потрібен інший спосіб назви. Спробуй піти від сусіда.',
    nextLabel: 'Далі',
  },
  raise: {
    title: 'Один півтон вгору',
    instruction: 'Йди від білої клавіші на півтон вгору й дивись, куди потрапиш.',
    task: 'Натисни білу клавішу C, потім піднімися на 1 півтон — натисни наступну клавішу праворуч. Повтори для D, F, G і A.',
    hint: {
      start: 'Почни з білої клавіші.',
      onWhite: (letter: NoteName) => `Ти на ${letter}. Піднімися на півтон вгору.`,
      noBlack: (letter: NoteName) => `Праворуч від ${letter} чорної клавіші немає.`,
      found: (letter: NoteName) => `Півтон вгору від ${letter} — чорна клавіша ${keyOfSpelledName(`${letter}${sharpSign}`)}. Це ${letter}${sharpSign}.`,
      miss: (letter: NoteName) => `Ця клавіша не на півтон вище за ${letter}. Порахуй: потрібна найближча клавіша праворуч.`,
      pickWhite: 'Спершу натисни білу клавішу, а потім піднімися від неї.',
    },
    foundStatus: (count: number) => `Знайдено: ${count} з ${lettersWithSharp.length}.`,
    term: `Цей півтон вгору позначають знаком ${sharpSign} — «дієз». C${sharpSign} читається «${sharpWord('C')}» і означає звук на півтон вище за C.`,
    table: (letters: readonly NoteName[]) => letters.map((letter) => `${letter}${sharpSign}`).join(' '),
    tableTitle: 'Дієзи, які ти знайшов',
    question: 'Для яких білих клавіш не знайшлося чорної праворуч? Подивись на E і B. Що буде з півтоном вгору від них — розберемо далі.',
    withoutAudio: 'Без звуку: чорні клавіші — 1, 3, 6, 8 і 10. Праворуч від C це клавіша 1, від D — 3, від F — 6, від G — 8, від A — 10.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  lower: {
    title: 'Той самий звук іншим шляхом',
    instruction: 'Тепер піди від білої клавіші вниз.',
    prediction: {
      question: 'Що буде, якщо від D піти на півтон вниз?',
      choices: [
        { id: 'same', label: 'На ту саму чорну клавішу', feedback: 'Перевір сам: натисни D і спустися на півтон.' },
        { id: 'white', label: 'На білу клавішу', feedback: 'Перевір сам: натисни D і спустися на півтон.' },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого страшного: перевіриш сам.' },
      ],
      correctChoiceId: 'same',
    },
    task: 'Натисни D і спустися на 1 півтон — натисни наступну клавішу ліворуч. Повтори для E, G, A і B.',
    hint: {
      start: 'Почни з білої клавіші.',
      onWhite: (letter: NoteName) => `Ти на ${letter}. Спустися на півтон вниз.`,
      noBlack: (letter: NoteName) => `Ліворуч від ${letter} чорної клавіші немає.`,
      found: (letter: NoteName) => `Півтон вниз від ${letter} — чорна клавіша ${keyOfSpelledName(`${letter}${flatSign}`)}. Це ${letter}${flatSign}.`,
      miss: (letter: NoteName) => `Ця клавіша не на півтон нижче за ${letter}. Порахуй: потрібна найближча клавіша ліворуч.`,
      pickWhite: 'Спершу натисни білу клавішу, а потім спустися від неї.',
    },
    foundStatus: (count: number) => `Знайдено: ${count} з ${lettersWithFlat.length}.`,
    term: `Півтон вниз позначають знаком ${flatSign} — «бемоль». D${flatSign} читається «${flatWord('D')}»: звук на півтон нижче за D.`,
    table: (letters: readonly NoteName[]) => letters.map((letter) => `${letter}${flatSign}`).join(' '),
    tableTitle: 'Бемолі, які ти знайшов',
    question: 'Що ти помітив: на яку клавішу потрапив D♭ і де вже була C♯?',
    withoutAudio: 'Без звуку: півтон вниз від D — клавіша 1, а вона вже була півтоном вгору від C.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  same: {
    title: 'Дві назви — один звук',
    instruction: 'Одна клавіша має дві назви. Чи звучать вони по-різному?',
    keyNote: `Клавіша ${middleBlackKey}: C${sharpSign} = D${flatSign}`,
    frequencyNote: `Частота клавіші ${middleBlackKey}: ${middleBlackHertz}`,
    playAs: (name: string) => `Грати як ${name}`,
    stopLabel: 'Зупинити',
    withoutAudio: 'Без звуку: обидві кнопки грали б клавішу 1, тож звук однаковий.',
    question: {
      question: 'Чи звучить D♭ інакше, ніж C♯?',
      choices: [
        { id: 'different', label: 'Так, інакше', feedback: 'Ні: порівняй частоти — вони однакові.' },
        { id: 'same', label: 'Ні, звук той самий', feedback: `Так: частота однакова — ${middleBlackHertz}. Це видно в числі, а не лише на слух.` },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого страшного: натисни обидві кнопки й порівняй число частоти.' },
      ],
      correctChoiceId: 'same',
    },
    term: 'Такі назви — різні назви одного звуку — називають енгармонічними. Так буває, бо наша система ділить октаву на 12 рівних кроків; її називають рівномірним строєм. Існують й інші системи, але ми працюємо з цією.',
    pairsTitle: 'З’єднай назви одного звуку',
    pairsInstruction: 'Для решти чотирьох чорних клавіш обери дієз ліворуч і бемоль праворуч, що звучать однаково.',
    pairs: {
      caption: 'Назви чорних клавіш',
      leftTitle: 'Дієз',
      rightTitle: 'Бемоль',
      pickFirst: 'Спершу обери дієз ліворуч.',
      picked: (name: string) => `Обрано ${name}. Тепер обери бемоль праворуч.`,
      matched: (first: string, second: string) => `Так: ${first} і ${second} — одна клавіша ${keyOfSpelledName(first)}.`,
      miss: (first: string, second: string) => `Ні: ${first} — клавіша ${keyOfSpelledName(first)}, а ${second} — клавіша ${keyOfSpelledName(second)}. Спробуй ще.`,
      done: 'Усі чотири пари з’єднано.',
    },
    conclusion: 'Яку з двох назв обрати, залежить від контексту, про це — далі. Звук від вибору назви не змінюється.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  edges: {
    title: 'Де немає чорної',
    instruction: 'Знак працює й там, де праворуч немає чорної клавіші.',
    prediction: {
      question: 'Що буде, якщо піднятися на півтон від E?',
      choices: [
        { id: 'black', label: 'Чорна клавіша', feedback: 'Перевір далі: подивись, що праворуч від E.' },
        { id: 'F', label: 'Біла клавіша F', feedback: 'Перевір далі: подивись, що праворуч від E.' },
        { id: 'nothing', label: 'Нічого — звуку немає', feedback: 'Перевір далі: подивись, що праворуч від E.' },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого страшного: перевіриш далі.' },
      ],
      correctChoiceId: 'F',
    },
    explanation: 'Між E і F чорної клавіші немає (урок 3), тож півтон вгору від E — уже біла клавіша F. Отже, E♯ і F — одне й те саме.',
    casesTitle: 'Перевір чотири випадки',
    casesInstruction: 'Натискай кожен випадок і дивись, на яку білу клавішу він потрапляє.',
    case: (name: string) => `Перевірити ${name}`,
    caseResult: (name: string, letter: NoteName) => `${name} = ${letter}`,
    caseStatus: (count: number) => `Перевірено: ${count} з ${edgeCases.length}.`,
    pattern: 'Знак зсуває звук на півтон, незалежно від того, якого кольору клавіша.',
    control: {
      question: 'Яка біла клавіша відповідає B♯?',
      choices: letterChoices(sharpEdge, `B♯ — півтон вгору від B, і це ${sharpEdge}.`),
      correctChoiceId: sharpEdge,
    },
    naturalTitle: 'Знак можна прибрати',
    natural: `Знак ${naturalSign} читається «бекар» і означає «без знака»: C${naturalSign} = C.`,
    naturalButton: 'Прибрати ♯ з C♯',
    naturalResult: `C${sharpSign} → C${naturalSign} = C: звук повернувся на білу клавішу C.`,
    withoutAudio: 'Без звуку: E — клавіша 4, F — клавіша 5; між ними чорної немає. B — клавіша 11, C — клавіша 12.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  guitar: {
    title: 'Півтон на струні',
    instruction: 'Порівняй звук струни зі звуком, що на півтон вище.',
    experiment: {
      title: 'Відкрита струна й півтон над нею',
      withGuitar: 'Смикни відкриту струну, яка звучить на 110 Гц, потім злегка притисни її ближче до підставки, щоб звук став на півтон вище, і смикни ще раз. Порівняй із кнопкою «Послухати півтон вище».',
      withoutGuitar: 'Натисни «Послухати струну 110 Гц», а потім «Послухати півтон вище» й порівняй.',
      safety: 'Смикай м’яко, подушечкою пальця.',
    },
    listenString: 'Послухати струну 110 Гц',
    listenSemitone: `Послухати півтон вище (${hertz(guitarSemitoneFrequency)})`,
    question: 'Як би ти назвав цей звук? Назви його двома способами.',
    note: 'Відповіді тут не оцінюються.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  checkpoint: {
    title: 'Назви й чорні клавіші',
    instruction: 'Чотири завдання. Помилка не карається: кожна відповідь має пояснення.',
    solved: 'Усі завдання виконано.',
    names: {
      question: 'Обери всі назви підсвіченої чорної клавіші.',
      highlightKey: checkpointKey,
      options: keyAnswerNames,
      correct: [...checkpointNames],
      checkLabel: 'Перевірити',
      right: `Так: клавіша ${checkpointKey} має дві назви — ${checkpointNames.join(' і ')}.`,
      wrong: `Ні: назви клавіші ${checkpointKey} — ${checkpointNames.join(' і ')}. Дієз іде від білої ліворуч, бемоль — від білої праворуч.`,
    },
    find: {
      question: `Знайди на клавіатурі клавішу ${checkpointFindName} і натисни її.`,
      targetKey: keyOfSpelledName(checkpointFindName) as number,
      right: `Так: ${checkpointFindName} — клавіша ${keyOfSpelledName(checkpointFindName)}.`,
      wrong: (key: number) => `Це клавіша ${key}. ${checkpointFindName} — півтон нижче за G.`,
    },
    pairs: {
      question: 'Для кожної пари назв визнач: це один звук чи різні?',
      items: checkpointPairs.map(([first, second]) => ({
        first,
        second,
        same: areEnharmonic(first, second),
        explanation: areEnharmonic(first, second)
          ? `${first} і ${second} — одна клавіша ${keyOfSpelledName(first)}.`
          : `${first} — клавіша ${keyOfSpelledName(first)}, а ${second} — клавіша ${keyOfSpelledName(second)}.`,
      })),
      sameLabel: 'Один звук',
      differentLabel: 'Різні звуки',
      right: 'Так.',
      wrong: 'Ні: порівняй позиції на клавіатурі.',
    },
    natural: {
      question: 'Яка біла клавіша відповідає E♯?',
      choices: letterChoices(edgeLetters['E♯'], `E♯ — півтон вгору від E, і це ${edgeLetters['E♯']}.`),
      correctChoiceId: edgeLetters['E♯'],
    },
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  complete: {
    title: 'Підсумок',
    summaryTitle: 'Що ти знайшов',
    summary: [
      'Кожна чорна клавіша має дві назви: ♯ вгору від сусідньої білої і ♭ вниз.',
      'Ці назви енгармонічні: звук один, бо система має 12 рівних кроків.',
      'E♯ = F, C♭ = B, а знак ♮ скасовує знак.',
    ],
    finishLabel: 'Завершити урок',
    finished: 'Урок завершено.',
    feedback: 'Ти сам знайшов дієзи й бемолі, а потім отримав для них назви.',
    bridgeTitle: 'Наступне питання',
    bridge: 'Тепер усі 12 клавіш мають назви. Пройдімо 12 півтонів підряд — і куди ми потрапимо?',
    bridgeNote: 'Подумай своїми словами: відповідь буде в наступному уроці.',
    backToCourse: 'До курсу',
    backLabel: 'Назад',
  },
} as const;
