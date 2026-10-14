import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonElevenContent } from '@/data/lessons/stage-03-lesson-01/constants';
import { hertz } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';
import { openStrings } from '@/data/lessons/stage-03-lesson-02-model/constants';
import { fretSteps, fretToNextString, linkedStrings, stringByNumber, totalSemitones } from '@/data/lessons/stage-03-lesson-02-model/utils/strings';

// How many strings the learner must touch on `strings`, and the pairs found on `link`.
export const requiredHeardStrings = 3;
export const linkPairs: readonly number[] = linkedStrings.filter((number) => number > 2);
export const allFrets: readonly number[] = Array.from({ length: 13 }, (_, fret) => fret);

// Order shown at the start of the ordering task (a fixed shuffle, not by pitch).
export const orderStart: readonly number[] = [3, 6, 1, 4, 2, 5];
export const correctOrder: readonly number[] = [...openStrings].map((item) => item.number);

const pairName = (number: number) => `${number}→${number - 1}`;
const fretChoices = (correct: number, explain: (fret: number) => string) => [3, 4, 5, 7].map((fret) => ({ id: String(fret), label: `лад ${fret}`, feedback: fret === correct ? explain(fret) : `Ні: ${explain(correct)}` }));
const noteChoices = ['A♯', 'B', 'C', 'A'].map((name) => ({ id: name, label: name, feedback: name === 'B' ? 'Так: від G до B — 4 півтони (G♯, A, A♯, B).' : 'Ні: від G до B — 4 півтони (G♯, A, A♯, B).' }));

export const lessonTwelveContent = {
  id: 'stage-03-lesson-02',
  stageLabel: 'Етап III · Гриф',
  title: 'Шість струн і зв’язки між ними',
  estimatedTime: '12–15 хв',
  stepLabels: { intro: 'Шість звуків', strings: 'Яка струна яка', link: 'Зв’язок', pattern: 'Закономірність', guitar: 'Гітара', checkpoint: 'Перевірка', complete: 'Підсумок' },
  preferences: lessonTwoContent.preferences,
  pairName,
  map: {
    label: 'Шість струн гітари: 6-та знизу — найтовща, 1-ша зверху — найтонша',
    stringButtons: 'Вибір струни',
    fretPicker: 'Вибір лада',
    thick: 'товста',
    thin: 'тонка',
    hidden: 'нота прихована',
    describeString: (number: number, note: string | null, frequency: number | null) => note === null || frequency === null
      ? `Струна ${number}`
      : `Струна ${number}, нота ${note}, ${hertz(frequency)}`,
    describeFret: (fret: number) => (fret === 0 ? 'відкрита' : `лад ${fret}`),
    pressed: (number: number, fret: number) => `Притиснуто: струна ${number}, ${fret === 0 ? 'відкрита' : `лад ${fret}`}`,
  },
  intro: {
    title: 'Шість звуків',
    reminder: lessonElevenContent.complete.bridge,
    instruction: 'Ми дослідили одну струну. Тепер послухай усі шість відкритих струн: від найтовщої (6) до найтоншої (1).',
    listenAll: 'Послухати всі шість',
    stopLabel: 'Зупинити',
    withoutAudio: `Без звуку: відкриті струни звучать на ${openStrings.map((item) => hertz(item.frequency)).join(', ')}.`,
    prediction: {
      question: 'Звук піднімається від струни до струни. Кроки між сусідніми струнами однакові?',
      choices: [
        { id: 'yes', label: 'Так, однакові', feedback: 'Перевір це далі, коли знайдеш зв’язки.' },
        { id: 'no', label: 'Ні, різні', feedback: 'Перевір це далі, коли знайдеш зв’язки.' },
        { id: 'unknown', label: 'Не знаю', feedback: 'Нічого: це ми з’ясуємо разом.' },
      ],
      correctChoiceId: 'no',
    },
    nextLabel: 'Далі',
  },
  strings: {
    title: 'Яка струна яка',
    instruction: 'Торкайся струн на схемі й слухай. Номер, товщина й нота з’являються після дотику.',
    prediction: {
      question: 'Яка струна звучить вище: товста чи тонка?',
      choices: [
        { id: 'thick', label: 'Товста', feedback: 'Перевір сам: послухай 6-ту й 1-шу.' },
        { id: 'thin', label: 'Тонка', feedback: 'Перевір сам: послухай 6-ту й 1-шу.' },
      ],
      correctChoiceId: 'thin',
    },
    heardStatus: (count: number) => `Прослухано струн: ${count} з ${requiredHeardStrings} потрібних.`,
    withoutAudio: 'Без звуку: дивись на ноту й число частоти.',
    orderTitle: 'Розстав струни від найнижчої до найвищої',
    orderHelp: 'Кнопками «вище» й «нижче» зміни порядок. Послухай струни, якщо сумніваєшся.',
    up: 'Вище',
    down: 'Нижче',
    orderItem: (number: number, position: number) => `${position}. Струна ${number}: ${number === 6 ? 'найтовща' : number === 1 ? 'найтонша' : stringByNumber(number).openNote}`,
    check: 'Перевірити порядок',
    right: 'Так: від найтовщої (6) до найтоншої (1) звук піднімається.',
    wrong: 'Не зовсім. Правильний порядок: 6, 5, 4, 3, 2, 1 — від найтовщої до найтоншої.',
    notes: `Ноти йдуть ${openStrings.map((item) => item.openNote).join(', ')}: перша й остання однакові. Чому — відповімо далі.`,
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  link: {
    title: 'Один лад — і вже сусідня струна',
    instruction: 'Притисни струну на деякому ладі так, щоб вона зазвучала як відкрита сусідня, тонша струна.',
    prediction: {
      question: 'Притисни 6-ту струну. На якому ладі вона зазвучить як відкрита 5-та?',
      choices: ['3', '5', '7', '12'].map((id) => ({ id, label: `Лад ${id}`, feedback: 'Перевір сам: знайди лад, де частоти збігаються.' })),
      correctChoiceId: '5',
    },
    pairLabel: 'Пара струн',
    pair: (number: number) => `${pairName(number)}`,
    pairIntro: (number: number) => `Притиснута струна ${number} має зазвучати як відкрита струна ${number - 1}.`,
    compare: 'Порівняти',
    compareText: (pressed: number, open: number) => `Притиснута ${hertz(pressed)}, відкрита ${hertz(open)}: притиснута ${Math.round(pressed) === Math.round(open) ? 'звучить так само' : pressed > open ? 'вища' : 'нижча'}.`,
    match: 'Збіг! Звучить як відкрита сусідня струна.',
    noMatch: 'Ще не збіг. Спробуй інший лад.',
    foundStatus: (count: number, total: number) => `Знайдено зв’язків: ${count} з ${total}.`,
    tableTitle: 'Знайдені зв’язки',
    tableRow: (number: number, fret: number) => `${pairName(number)}: лад ${fret}`,
    withoutAudio: 'Без звуку: порівнюй числа частот.',
    exceptionHint: 'Тут лад менший, ніж у інших пар. Подивись на числа.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  pattern: {
    title: 'Закономірність',
    instruction: 'Ти знайшов лади для перших чотирьох пар. Дізнайся, який лад для останньої, і побач закономірність.',
    prediction: {
      question: 'Останньою парою є 2→1. Якого ладу ти чекаєш?',
      choices: [4, 5, 6].map((fret) => ({ id: String(fret), label: `Лад ${fret}`, feedback: 'Перевір слухом: натисни кнопку нижче.' })),
      correctChoiceId: '5',
    },
    checkLabel: 'Перевірити слухом: 2-га струна, лад 5',
    checkResult: 'Лад 5 на 2-й струні звучить як відкрита 1-ша: зв’язок 2→1 — це лад 5.',
    tableTitle: 'Зв’язки між струнами',
    tableRow: (number: number, fret: number | null) => `${pairName(number)}: ${fret === null ? '?' : `лад ${fret}`}`,
    patternQuestion: {
      question: 'Який ряд ладів ти знайшов (6→5, 5→4, 4→3, 3→2, 2→1)?',
      choices: [
        { id: 'all-five', label: 'Усюди 5', feedback: 'Ні: у парі 3→2 лад 4.' },
        { id: 'five-four', label: '5, 5, 5, 4, 5', feedback: 'Так: чотири пари по п’ять ладів і одна — чотири.' },
        { id: 'different', label: 'Кожен різний', feedback: 'Ні: майже скрізь 5, і лише одна пара виняток.' },
      ],
      correctChoiceId: 'five-four',
    },
    semitoneReminder: 'Лад — це півтон, тож це 5, 5, 5, 4 і 5 півтонів між сусідніми струнами.',
    sumTitle: 'Скільки разом?',
    sum: `${fretSteps.join(' + ')} = ${totalSemitones()} півтони — це 2 октави (${totalSemitones() / 12} × 12). Тому 1-ша струна — знову E, але на дві октави вища за 6-ту: ${hertz(openStrings[0].frequency)} → ${hertz(openStrings[5].frequency)}.`,
    nameTitle: 'Назва',
    name: 'Такий набір відкритих струн називають строєм. Наш — стандартний стрій E–A–D–G–B–E.',
    openQuestion: 'Чому в одному місці не 5, а 4? Це питання ми розберемо далі.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  guitar: {
    title: 'На справжній гітарі',
    instruction: 'Перевір зв’язки на справжній гітарі.',
    experiment: {
      title: 'Лади й сусідні струни',
      withGuitar: 'Притисни 6-ту струну на 5-му ладі й порівняй із відкритою 5-ю. Так само 5-ту на 5-му ладі з відкритою 4-ю, 4-ту на 5-му з відкритою 3-ю, 3-тю на 4-му з відкритою 2-ю. Потім порівняй відкриту 6-ту й відкриту 1-шу: ті самі ноти, але на дві октави.',
      withoutGuitar: 'Без гітари: натискай кнопки нижче й слухай пари: притиснута струна, потім відкрита сусідня.',
      safety: 'Притискай струну пальцем біля порожка, не сильно. Якщо болить — зроби паузу.',
    },
    listenPair: (number: number) => `Пара ${pairName(number)}, лад ${fretToNextString(number)}`,
    listenOctaves: 'Відкрита 6-та, потім відкрита 1-ша',
    question: 'Чи збігається те, що ти чуєш на гітарі, з тим, що було на схемі?',
    note: 'Відповіді тут не оцінюються: це твоє спостереження.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  checkpoint: {
    title: 'Перевір себе',
    instruction: 'Три короткі завдання. Помилка не карається: у кожної відповіді є пояснення.',
    tasks: [
      {
        id: 'from-neighbour',
        title: 'Завдання 1. Лад для сусідньої струни',
        questions: [
          { id: 'q43', question: 'На якому ладі 4-ї струни звучить відкрита 3-тя?', choices: fretChoices(5, (fret) => `Лад ${fret}: 4→3 — п’ять півтонів.`), correctChoiceId: '5' },
          { id: 'q32', question: 'На якому ладі 3-ї струни звучить відкрита 2-га?', choices: fretChoices(4, (fret) => `Лад ${fret}: 3→2 — чотири півтони.`), correctChoiceId: '4' },
          { id: 'q54', question: 'На якому ладі 5-ї струни звучить відкрита 4-та?', choices: fretChoices(5, (fret) => `Лад ${fret}: 5→4 — п’ять півтонів.`), correctChoiceId: '5' },
        ],
      },
      {
        id: 'note-of-string',
        title: 'Завдання 2. Нота струни',
        questions: [{ id: 'note2', question: 'Відкрита 3-тя струна — G. Яка нота на відкритій 2-й струні?', choices: noteChoices, correctChoiceId: 'B' }],
      },
      {
        id: 'sum',
        title: 'Завдання 3. Чому двічі E',
        questions: [{
          id: 'sum',
          question: 'Чому 1-ша й 6-та струни — обидві E?',
          choices: [
            { id: 'two-octaves', label: 'Між ними 24 півтони — це 2 октави', feedback: 'Так: 5 + 5 + 5 + 4 + 5 = 24 півтони, тобто 2 октави.' },
            { id: 'one-octave', label: 'Між ними 12 півтонів — це 1 октава', feedback: 'Ні: сума кроків — 24 півтони, тобто 2 октави.' },
            { id: 'random', label: 'Так просто склалося', feedback: 'Ні: це випливає з суми кроків — 24 півтони.' },
          ],
          correctChoiceId: 'two-octaves',
        }],
      },
    ],
    solvedStatus: (count: number, total: number) => `Розв’язано: ${count} з ${total}.`,
    passed: 'Усі завдання розв’язано.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  complete: {
    title: 'Підсумок',
    summaryTitle: 'Що ти відкрив',
    summary: [
      'Шість відкритих струн: E, A, D, G, B, E — від найтовщої до найтоншої.',
      'Між сусідніми струнами 5, 5, 5, 4 і 5 півтонів, тобто ладів.',
      'Разом 24 півтони: 1-ша струна на дві октави вища за 6-ту.',
    ],
    finishLabel: 'Завершити урок',
    finished: 'Урок завершено.',
    feedback: 'Ти сам знайшов, як струни пов’язані між собою.',
    bridgeTitle: 'Наступне питання',
    bridge: 'Тепер ми знаємо відкриті струни. А яка нота на 7-му ладі 3-ї струни? Чи треба вчити таблицю, чи можна порахувати?',
    bridgeNote: 'Подумай своїми словами. Відповіді тут не оцінюються.',
    backLabel: 'Назад',
    backToCourse: 'До курсу',
  },
};

