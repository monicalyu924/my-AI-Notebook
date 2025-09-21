export { default as Board } from './Board';
export { default as List } from './List';
export { default as Card } from './Card';

// Export types
export interface CardData {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  assignees?: string[];
}

export interface ListData {
  id: string;
  title: string;
  cards: CardData[];
}

export interface BoardData {
  id: string;
  title: string;
  lists: ListData[];
}