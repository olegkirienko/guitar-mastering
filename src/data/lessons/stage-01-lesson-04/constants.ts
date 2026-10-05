import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import { timbrePresets } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { OvertoneTarget } from '@/data/lessons/stage-01-lesson-04-model/utils/checkpoint';
import type { DescriptionId } from '@/data/lessons/stage-01-lesson-04/types';

// How strong one overtone is, in the words the lesson uses everywhere: never «амплітуда».
const levelWords = { off: 'немає', weak: 'слабкий', strong: 'сильний' } as const;

const presetOptions = [
  { id: 'pure', label: 'чистий тон' },
  { id: 'pluck', label: 'щипок' },
  { id: 'bright', label: 'дзвінкий' },
] as const;

// The three numbers of every partial, in the same words wherever the spectrum is shown.
const spectrumTable = {
  multipleColumn: 'Кратність',
  frequencyColumn: 'Частота',
  strengthColumn: 'Сила',
  fundamentalStrength: 'звучить завжди',
  levels: levelWords,
} as const;

// The counterexample of `envelope`: one spectrum, two ways of starting and ending.
const envelopeSounds = {
  plucked: timbrePresets.pluck,
  swelling: { ...timbrePresets.pluck, attack: 'slow', decay: 'held' },
} as const;

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
  // Text alternative of every drawn envelope. Whole phrases, because this one has to
  // read as a sentence; the regulators get their own short words.
  envelopeWords: {
    attack: { instant: 'Початок миттєвий', fast: 'Початок швидкий', slow: 'Початок повільний' },
    decay: { short: 'затихає швидко', long: 'затихає поступово', held: 'звук тримається' },
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
    nextLabel: 'Шукати, звідки форма',
  },
  overtones: {
    title: 'Хвилі всередині хвилі',
    instruction: 'Складімо форму самі — з кількох хвиль одразу.',
    prediction: {
      question: 'До основної хвилі 220 Гц додамо хвилю, що повторюється вдвічі частіше, — 440 Гц. Звук стане…',
      choices: [
        { id: 'higher', label: 'Вищим', feedback: 'Перевіримо в досліді нижче.' },
        { id: 'same-pitch', label: 'Тієї самої висоти, але іншим', feedback: 'Перевіримо в досліді нижче.' },
        { id: 'two-sounds', label: 'Двома окремими звуками', feedback: 'Перевіримо в досліді нижче.' },
      ],
      correctChoiceId: 'same-pitch',
    },
    lab: {
      title: 'Дослід: додай швидші хвилі',
      note: 'Основна хвиля 220 Гц звучить завжди. Вмикай і вимикай швидші хвилі й дивись на малюнок.',
      mixer: {
        title: 'Хвилі у звуку',
        note: 'Увімкнена хвиля звучить на повну силу.',
        fundamentalNote: 'основна хвиля, звучить завжди',
      },
      waveLabel: 'Тонкі лінії — окремі хвилі, товста — їхня сума',
      listenLabel: 'Послухати',
      levels: levelWords,
      status: { overtone: 'Хвиля', samePitch: 'Висота та сама —' },
    },
    observationTitle: 'Що сталося',
    observations: [
      'Сума повторюється стільки ж разів, скільки основна хвиля: ×2 і ×3 вкладаються в один її повтор цілу кількість разів.',
      'Висота та сама, а форма повтору — інша. Саме цю різницю ми й чуємо.',
      'Зазвичай вухо зливає ці хвилі в один звук. Якщо вдається почути вищу окремо — це теж нормально, вухо в тебе уважне.',
    ],
    termTitle: 'Основна частота й обертони',
    term: 'Найнижчу частоту у звуку, яка задає висоту, називають основною частотою. Вищі частоти, що звучать разом із нею, — обертони.',
    modes: {
      title: 'Звідки обертони в струні?',
      note: 'З уроку 3: удвічі коротша частина, що коливається, коливається вдвічі частіше. Струна коливається всіма цими способами одночасно.',
      rows: [
        { id: 'whole', parts: 1, label: '×1 · 220 Гц — ціла струна', description: 'Струна гойдається як одне ціле. Це найнижча частота, і саме вона задає висоту.' },
        { id: 'halves', parts: 2, label: '×2 · 440 Гц — дві половини', description: 'Середина стоїть на місці, половини гойдаються навперемін. Удвічі коротші — удвічі частіше.' },
        { id: 'thirds', parts: 3, label: '×3 · 660 Гц — три третини', description: 'Дві точки стоять на місці, три частини гойдаються навперемін. Утричі коротші — утричі частіше.' },
      ],
    },
    guitar: {
      title: 'Почути обертон на гітарі',
      withGuitar: 'Ледь торкнись першої струни точно посередині — на класичній гітарі це над металевою планкою там, де гриф сходиться з корпусом. Не притискай. Смикни й одразу прибери палець.',
      withoutGuitar: 'Прочитай, що при цьому відбувається, нижче: обертон ×2, який ти щойно вмикав у досліді, ховається в кожній смикнутій струні.',
      safety: 'Торкайся легко, подушечкою пальця, і струну не притискай. Якщо з першого разу не вийшло — спробуй ще раз, зіпсувати тут нічого не можна.',
    },
    guitarResult: 'Середина не може рухатися, тож ціла струна вже не коливається — лишаються половинки. Чутно вищий дзвінкий звук, який увесь час ховався в струні. Вищий він тому, що дотик прибрав саме основну частоту: найнижчою з тих, що лишилися, стала ×2 — тепер висоту задає вона. Правило те саме: висоту задає найнижча частота у звуку.',
    backLabel: 'Назад до малюнків',
    nextLabel: 'Далі — склад звуку',
  },
  spectrum: {
    title: 'Склад звуку',
    instruction: 'Обертонів більше, і кожен може бути слабким або сильним.',
    lab: {
      title: 'Лабораторія звуку',
      note: 'Основна частота 220 Гц звучить завжди — висоту ти тут не зміниш. Міняй обертони.',
      mixer: {
        title: 'Обертони',
        note: 'Кожен обертон може бути відсутнім, слабким або сильним.',
        fundamentalNote: 'основна частота, звучить завжди',
      },
      waveLabel: 'Форма повтору',
      listenLabel: 'Послухати',
      levels: levelWords,
      status: { overtone: 'Обертон', samePitch: 'Висота та сама —' },
      spectrum: { title: 'Склад звуку', note: 'Які частоти є у звуку й наскільки кожна сильна.', ...spectrumTable },
      presets: {
        label: 'Готові звуки',
        options: presetOptions,
        resetLabel: 'Скинути',
        status: { preset: 'Звук:', reset: 'Повернули початковий звук.' },
      },
    },
    termTitle: 'Спектр',
    term: 'Малюнок, який показує, які частоти є у звуку й наскільки вони сильні, називають спектром.',
    predictionsTitle: 'Два передбачення',
    predictionsNote: 'Спочатку здогадка, потім перевірка в лабораторії вище.',
    predictions: [
      {
        id: 'brighter',
        question: 'Посилимо ×4 і ×5. Звук стане яскравішим чи м’якшим? Висота зміниться?',
        choices: [
          { id: 'brighter', label: 'Яскравішим, висота та сама', feedback: 'Перевір це в лабораторії.' },
          { id: 'softer', label: 'М’якшим, висота та сама', feedback: 'Перевір це в лабораторії.' },
          { id: 'higher', label: 'Яскравішим і вищим', feedback: 'Перевір це в лабораторії.' },
        ],
        correctChoiceId: 'brighter',
        target: { 4: 'strong', 5: 'strong' } satisfies OvertoneTarget,
        setupHint: 'Постав ×4 і ×5 на «сильний» — і послухай.',
        checked: 'Верхні обертони сильніші — звук яскравіший, дзвінкіший. Основна частота не змінилася, тож висота та сама.',
      },
      {
        id: 'pure',
        question: 'Приберемо всі обертони. Що почуємо?',
        choices: [
          { id: 'pure', label: 'Чистий тон тієї самої висоти', feedback: 'Перевір це в лабораторії.' },
          { id: 'lower', label: 'Нижчий звук', feedback: 'Перевір це в лабораторії.' },
          { id: 'silence', label: 'Тишу', feedback: 'Перевір це в лабораторії.' },
        ],
        correctChoiceId: 'pure',
        target: { 2: 'off', 3: 'off', 4: 'off', 5: 'off' } satisfies OvertoneTarget,
        setupHint: 'Постав усі обертони на «немає» або вибери готовий звук «чистий тон».',
        checked: 'Лишилася сама основна частота — рівний чистий тон з уроку 2, тієї самої висоти.',
      },
    ],
    guitarTitle: 'Де смикати струну',
    guitarText: 'Біля підставки смикнута струна має сильніші верхні обертони — звук яскравий. Над круглим отвором корпусу верхні обертони слабші — звук м’який, круглий. Це ти й чув на початку уроку.',
    guitar: {
      title: 'Нігтем і подушечкою',
      withGuitar: 'Смикни першу струну нігтем, потім подушечкою пальця — на тому самому місці. Який звук яскравіший?',
      withoutGuitar: 'Порівняй готові звуки в лабораторії: «дзвінкий» — це ніготь біля підставки, «щипок» — подушечка над отвором корпусу.',
      safety: 'Смикай м’яко. Ніготь веди вздовж струни, не чіпляйся за неї.',
    },
    deeper: {
      summary: 'Копнути глибше',
      paragraphs: [
        'Основну частоту разом з її обертонами називають частковими.',
        'Часткові, кратні основній частоті (×2, ×3, ×4…), називають гармоніками. Саме так звучить струна, людський голос, духові інструменти.',
        'У дзвона часткові не кратні основній, тому його висоту важко назвати одним числом — вона менш певна.',
        'Будь-яку форму повтору можна скласти з хвиль ×1, ×2, ×3… — саме це ти й робив у лабораторії.',
      ],
    },
    backLabel: 'Назад до обертонів',
    nextLabel: 'Далі — початок і кінець',
  },
  envelope: {
    // The step list is visible from the first screen, so this title stays in plain
    // words; the framing of the screen lives in the line under it.
    title: 'Початок і кінець звуку',
    instruction: 'Спектр той самий — а звуки різні. Два звуки, складені з тих самих частот, і все одно їх не сплутаєш.',
    spectrumTitle: 'Склад обох звуків — однаковий',
    spectrum: { title: 'Склад звуку', note: 'Той самий в обох: ×2 сильний, ×3, ×4 і ×5 слабкі.', ...spectrumTable },
    curveLabel: 'Гучність у часі',
    comparison: {
      caption: 'Два звуки 220 Гц',
      frequencyLabel: 'Однакова висота, однаковий склад.',
      listenLabel: 'Послухати',
      sounds: [
        { id: 'plucked', label: 'А · щипок', description: 'Умить набирає повну силу й далі поступово затихає.', sound: envelopeSounds.plucked },
        { id: 'swelling', label: 'Б · наростання', description: 'Повільно набирає силу й далі тримається рівно.', sound: envelopeSounds.swelling },
      ],
    },
    question: {
      question: 'Спектр однаковий. Що ж відрізняється?',
      choices: [
        { id: 'edges', label: 'Початок і кінець звуку', feedback: 'Подивись на малюнки гучності: один звук стрибає вгору відразу, другий наростає поволі.' },
        { id: 'pitch', label: 'Висота', feedback: 'Основна частота в обох — 220 Гц, тож висота однакова. Різниця десь іще.' },
        { id: 'overtones', label: 'Обертони', feedback: 'Обертони в них однакові — це той самий склад звуку в таблиці вище. Різниця десь іще.' },
      ],
      correctChoiceId: 'edges',
    },
    prediction: {
      question: 'Якщо щипку дати повільний початок, він лишиться схожим на щипок?',
      choices: [
        { id: 'yes', label: 'Так, спектр же той самий', feedback: 'Перевіримо в досліді нижче.' },
        { id: 'no', label: 'Ні, це вже не схоже на щипок', feedback: 'Перевіримо в досліді нижче.' },
      ],
      correctChoiceId: 'no',
    },
    lab: {
      title: 'Дослід: початок і кінець',
      note: 'Спектр тут заблокований — міняй лише початок і затихання. Висота теж не змінюється.',
      mixer: {
        title: 'Обертони',
        note: 'У цьому досліді їх не змінюємо: хай спектр лишається тим самим.',
        fundamentalNote: 'основна частота, звучить завжди',
      },
      listenLabel: 'Послухати',
      levels: levelWords,
      status: { overtone: 'Обертон', samePitch: 'Висота та сама —' },
      spectrum: { title: 'Склад звуку', note: 'Він не змінюється, хоч би що ти робив нижче.', ...spectrumTable },
      envelope: {
        title: 'Початок і затихання',
        note: 'Два регулятори: як швидко звук набирає силу і як швидко стихає.',
        curveLabel: 'Гучність у часі',
        attackLabel: 'Початок',
        decayLabel: 'Затихання',
        attacks: { instant: 'миттєвий', fast: 'швидкий', slow: 'повільний' },
        decays: { short: 'коротке', long: 'довге', held: 'тримається' },
      },
    },
    termTitle: 'Атака й згасання',
    term: 'Те, як швидко звук набирає силу, називають атакою. Те, як він затихає, — згасанням. Спектр, атака й згасання разом і дають тембр.',
    guitarTitle: 'Атака й згасання на гітарі',
    guitarText: 'Щипок завжди дає миттєву атаку — струну відпускають, і вона відразу звучить на повну. А далі звук згасає сам: це теж частина гітарного тембру. Згасання можна скоротити — поклади долоню на струну, як в уроці 1.',
    guitar: {
      title: 'Дати відзвучати й приглушити',
      withGuitar: 'Смикни першу струну й дай їй відзвучати до кінця. Потім смикни ще раз і через секунду поклади на струну долоню. Початок звуку однаковий, а кінець — різний.',
      withoutGuitar: 'У досліді вище постав затихання спершу на «довге», потім на «коротке» — долоня на струні робить саме це.',
      safety: 'Долоню клади м’яко, усією подушечкою. Струну не смикай нігтем згори.',
    },
    backLabel: 'Назад до складу звуку',
  },
  checkpoint: { title: 'Зроби сам і поясни' },
  complete: { title: 'Що ми з’ясували' },
} as const;
