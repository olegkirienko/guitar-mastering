export interface ChoiceQuestionChoice { id: string; label: string; spoken?: string; feedback: string; }

export interface ChoiceQuestionProps { question: string; spokenQuestion?: string; choices: readonly ChoiceQuestionChoice[]; correctChoiceId: string; mode?: 'assessment' | 'prediction'; checkLabel?: string; onCheck?: (choiceId: string, isCorrect: boolean) => void; }
