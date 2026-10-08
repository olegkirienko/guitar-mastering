import { lessonFiveContent } from '@/data/lessons/stage-01-lesson-05/constants';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';

// Frequencies of the cards on `same-name`; 660 is the one that is not the same sound.
export const sameNameFrequencies = [220, 440, 660, 880] as const;

// Stage II opens with the question Stage I ended on, so nothing here names a note
// besides «нота» itself and the «A» the bridge already used.
export const lessonSixContent = {
  id: 'stage-02-lesson-01',
  stageLabel: 'Етап II · Музична система',
  title: 'Чому 220, 440 і 880 Гц звучать як одна нота?',
  estimatedTime: '10–14 хв',
  stepLabels: { intro: 'Проблема', 'same-name': 'Ті самі звуки', doubler: 'Подвоєння', octave: 'Октава', guitar: 'Гітара', checkpoint: 'Перевірка', complete: 'Підсумок' },
  preferences: lessonTwoContent.preferences,
  intro: {
    title: 'Безліч частот',
    reminder: lessonFiveContent.complete.bridge,
    question: 'Скільки існує різних частот між 440 і 441 Гц?',
    listenLabels: { first: 'Послухати 440', second: 'Послухати 441' },
    listenNote: 'Послухай обидва звуки й вирішуй сам: чуєш різницю чи ні. Відповіді тут не оцінюються.',
    between: {
      title: 'Між ними',
      instruction: 'Візьми половину відстані між двома найближчими частотами й подивися, чи знайдеться ще одна.',
      stepLabel: 'Знайти ще одну між ними',
      startPair: [440, 441],
      values: ['440,5', '440,25', '440,125', '440,0625'],
      found: 'Знайдено ще одну частоту:',
      unitLabel: 'Гц',
      always: 'І так щоразу: між будь-якими двома частотами є ще одна. Їх безліч.',
    },
    discovery: 'Частот безліч, а музика користується лише відібраними. Таку добірку називають системою звуків. Звук, якому музика дала власну назву, називають нотою.',
    systemNote: 'Систему можна відбирати по-різному. Ми вивчаємо одну — найпоширенішу для гітари.',
    nextQuestion: 'Чому ж тоді 220, 440 і 880 Гц називають однаково?',
    nextLabel: 'Далі',
  },
  sameName: {
    title: 'Які звуки «ті самі»?',
    instruction: 'Спершу прогноз, потім слух.',
    prediction: {
      question: 'Це чотири звуки: 220, 440, 660 і 880 Гц. Три з них звучать як один звук на різній висоті, а один — інакше. Який із них інший?',
      choices: [
        { id: '220', label: '220 Гц', feedback: 'Перевір слухом нижче.' },
        { id: '440', label: '440 Гц', feedback: 'Перевір слухом нижче.' },
        { id: '660', label: '660 Гц', feedback: 'Перевір слухом нижче.' },
        { id: '880', label: '880 Гц', feedback: 'Перевір слухом нижче.' },
      ],
      correctChoiceId: '660',
    },
    cardsTitle: 'Послухай усі чотири',
    cardLabel: (frequency: number) => `Послухати ${frequency}`,
    heardLabel: 'прослухано',
    cardNote: 'Без звуку відповідай за описом: три з чотирьох — наче той самий звук, що піднявся.',
    result: 'Три з чотирьох — наче один звук на різній висоті: 220, 440 і 880 Гц. 660 Гц звучить як інший.',
    pattern: 'Що в них спільного?',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  doubler: {
    title: 'Подвоєння частоти',
    instruction: 'Змінюй частоту й слухай, що відбувається зі звуком.',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  octave: {
    title: 'Закономірність і назва',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  guitar: {
    title: 'Те саме на гітарі',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  checkpoint: {
    title: 'Знайди октаву',
    backLabel: 'Назад',
    nextLabel: 'Далі',
  },
  complete: {
    title: 'Підсумок',
    backLabel: 'Назад',
  },
} as const;
