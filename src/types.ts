export type Difficulty = 'easy' | 'medium' | 'hard';

export type CivilizationId =
  | 'ancient-egypt-mesopotamia'
  | 'ancient-greece-rome'
  | 'medieval-europe'
  | 'ottoman-islamic'
  | 'east-asia'
  | 'colonial-napoleonic'
  | 'american-wars'
  | 'world-wars'
  | 'south-america';

export const CIVILIZATIONS: { id: CivilizationId; label: string }[] = [
  { id: 'ancient-egypt-mesopotamia', label: 'Ancient Egypt & Mesopotamia' },
  { id: 'ancient-greece-rome',       label: 'Ancient Greece & Rome' },
  { id: 'medieval-europe',           label: 'Medieval Europe' },
  { id: 'ottoman-islamic',           label: 'Ottoman & Islamic' },
  { id: 'east-asia',                 label: 'East Asia' },
  { id: 'colonial-napoleonic',       label: 'Colonial & Napoleonic' },
  { id: 'american-wars',             label: 'American Wars' },
  { id: 'world-wars',                label: 'World Wars' },
  { id: 'south-america',             label: 'South America' },
];

export interface Battle {
  id: number;
  name: string;
  civilization: CivilizationId;
  acceptedAnswers: string[];
  prompt: string;
  hints: string[];
  difficulty: Difficulty;
  year: number;
  location: string;
  description: string;
}

export interface RoundResult {
  battleId: number;
  battleName: string;
  userAnswer: string;
  correct: boolean;
  pointsEarned: number;
  hintsUsed: number;
}

export interface GameFilter {
  civilization?: CivilizationId; // undefined = all
}
