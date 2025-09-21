import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { aiEventSystem } from '../utils/aiEventSystem';

export interface CardData {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  assignees?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListData {
  id: string;
  title: string;
  cards: CardData[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardData {
  id: string;
  title: string;
  lists: ListData[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectBoardState {
  boards: BoardData[];
  currentBoard: BoardData | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectBoardActions {
  setCurrentBoard: (board: BoardData) => void;
  createBoard: (title: string) => BoardData;
  updateBoard: (boardId: string, updates: Partial<BoardData>) => void;
  deleteBoard: (boardId: string) => void;
  
  createList: (boardId: string, title: string) => void;
  updateList: (boardId: string, listId: string, updates: Partial<ListData>) => void;
  deleteList: (boardId: string, listId: string) => void;
  
  createCard: (boardId: string, listId: string, title: string) => void;
  updateCard: (boardId: string, listId: string, cardId: string, updates: Partial<CardData>) => void;
  deleteCard: (boardId: string, listId: string, cardId: string) => void;
  moveCard: (boardId: string, sourceListId: string, destListId: string, cardId: string, newIndex?: number) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // AI辅助功能
  checkProjectProgress: () => number;
}

const createDefaultBoard = (): BoardData => ({
  id: `board-${Date.now()}`,
  title: '新项目看板',
  lists: [
    {
      id: `list-${Date.now()}-1`,
      title: '待办',
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `list-${Date.now()}-2`,
      title: '进行中',
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `list-${Date.now()}-3`,
      title: '已完成',
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const useProjectBoardStore = create<ProjectBoardState & ProjectBoardActions>()(
  persist(
    (set, get) => ({
      boards: [createDefaultBoard()],
      currentBoard: createDefaultBoard(),
      isLoading: false,
      error: null,

      setCurrentBoard: (board) => set({ currentBoard: board }),

      createBoard: (title) => {
        const newBoard: BoardData = {
          id: `board-${Date.now()}`,
          title,
          lists: [
            {
              id: `list-${Date.now()}-1`,
              title: '待办',
              cards: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: `list-${Date.now()}-2`,
              title: '进行中',
              cards: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: `list-${Date.now()}-3`,
              title: '已完成',
              cards: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          boards: [...state.boards, newBoard],
          currentBoard: newBoard
        }));

        return newBoard;
      },

      updateBoard: (boardId, updates) => {
        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId
              ? { ...board, ...updates, updatedAt: new Date().toISOString() }
              : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? { ...state.currentBoard, ...updates, updatedAt: new Date().toISOString() }
            : state.currentBoard
        }));
      },

      deleteBoard: (boardId) => {
        set((state) => {
          const newBoards = state.boards.filter(board => board.id !== boardId);
          const newCurrentBoard = state.currentBoard?.id === boardId
            ? newBoards[0] || createDefaultBoard()
            : state.currentBoard;

          return {
            boards: newBoards,
            currentBoard: newCurrentBoard
          };
        });
      },

      createList: (boardId, title) => {
        const newList: ListData = {
          id: `list-${Date.now()}`,
          title,
          cards: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId
              ? { ...board, lists: [...board.lists, newList], updatedAt: new Date().toISOString() }
              : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? { ...state.currentBoard, lists: [...state.currentBoard.lists, newList], updatedAt: new Date().toISOString() }
            : state.currentBoard
        }));
      },

      updateList: (boardId, listId, updates) => {
        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map(list =>
                    list.id === listId
                      ? { ...list, ...updates, updatedAt: new Date().toISOString() }
                      : list
                  ),
                  updatedAt: new Date().toISOString()
                }
              : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? {
                ...state.currentBoard,
                lists: state.currentBoard.lists.map(list =>
                  list.id === listId
                    ? { ...list, ...updates, updatedAt: new Date().toISOString() }
                    : list
                ),
                updatedAt: new Date().toISOString()
              }
            : state.currentBoard
        }));
      },

      deleteList: (boardId, listId) => {
        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.filter(list => list.id !== listId),
                  updatedAt: new Date().toISOString()
                }
              : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? {
                ...state.currentBoard,
                lists: state.currentBoard.lists.filter(list => list.id !== listId),
                updatedAt: new Date().toISOString()
              }
            : state.currentBoard
        }));
      },

      createCard: (boardId, listId, title) => {
        console.log('createCard被调用:', { boardId, listId, title });
        const newCard: CardData = {
          id: `card-${Date.now()}`,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map(list =>
                    list.id === listId
                      ? { ...list, cards: [...list.cards, newCard] }
                      : list
                  ),
                  updatedAt: new Date().toISOString()
                }
              : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? {
                ...state.currentBoard,
                lists: state.currentBoard.lists.map(list =>
                  list.id === listId
                    ? { ...list, cards: [...list.cards, newCard] }
                    : list
                ),
                updatedAt: new Date().toISOString()
              }
            : state.currentBoard
        }));

        console.log('卡片创建完成:', newCard);

        // 发送AI事件
        const currentBoard = get().currentBoard;
        if (currentBoard) {
          aiEventSystem.sendCardEvent('created', { 
            card: newCard, 
            listId, 
            boardId,
            board: currentBoard 
          });
          
          // 检查是否需要自动分配成员
          const suggestion = aiEventSystem.generateAssignmentSuggestions(currentBoard, newCard);
          if (suggestion) {
            console.log('AI建议分配成员:', suggestion);
          }
        }
      },

      updateCard: (boardId, listId, cardId, updates) => {
        const oldCard = get().currentBoard?.lists
          .find(list => list.id === listId)
          ?.cards.find(card => card.id === cardId);

        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map(list =>
                    list.id === listId
                      ? {
                          ...list,
                          cards: list.cards.map(card =>
                            card.id === cardId
                              ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                              : card
                          )
                        }
                      : list
                  ),
                  updatedAt: new Date().toISOString()
                }
              : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? {
                ...state.currentBoard,
                lists: state.currentBoard.lists.map(list =>
                  list.id === listId
                    ? {
                        ...list,
                        cards: list.cards.map(card =>
                          card.id === cardId
                            ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                            : card
                        )
                      }
                    : list
                ),
                updatedAt: new Date().toISOString()
              }
            : state.currentBoard
        }));

        // 发送AI事件
        const currentBoard = get().currentBoard;
        if (currentBoard && oldCard) {
          const updatedCard = { ...oldCard, ...updates };
          
          // 检查是否逾期
          if (updates.dueDate || oldCard.dueDate) {
            const isOverdue = aiEventSystem.checkCardOverdue(updatedCard);
            if (isOverdue) {
              aiEventSystem.sendCardEvent('overdue', { 
                card: updatedCard, 
                listId, 
                boardId,
                daysOverdue: Math.floor((Date.now() - new Date(updatedCard.dueDate).getTime()) / (1000 * 60 * 60 * 24))
              });
            }
          }
          
          // 发送更新事件
          aiEventSystem.sendCardEvent('updated', { 
            oldCard, 
            newCard: updatedCard, 
            listId, 
            boardId 
          });
        }
      },

      deleteCard: (boardId, listId, cardId) => {
        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId
              ? {
                  ...board,
                  lists: board.lists.map(list =>
                    list.id === listId
                      ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
                      : list
                  ),
                  updatedAt: new Date().toISOString()
                }
              : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? {
                ...state.currentBoard,
                lists: state.currentBoard.lists.map(list =>
                  list.id === listId
                    ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
                    : list
                ),
                updatedAt: new Date().toISOString()
              }
            : state.currentBoard
        }));
      },

      moveCard: (boardId, sourceListId, destListId, cardId, newIndex) => {
        set((state) => {
          const board = state.boards.find(b => b.id === boardId) || state.currentBoard;
          if (!board) return state;

          const sourceList = board.lists.find(l => l.id === sourceListId);
          const destList = board.lists.find(l => l.id === destListId);
          const card = sourceList?.cards.find(c => c.id === cardId);

          if (!sourceList || !destList || !card) return state;

          const newLists = board.lists.map(list => {
            if (list.id === sourceListId) {
              return { ...list, cards: list.cards.filter(c => c.id !== cardId) };
            }
            if (list.id === destListId) {
              const newCards = [...list.cards];
              if (newIndex !== undefined) {
                newCards.splice(newIndex, 0, card);
              } else {
                newCards.push(card);
              }
              return { ...list, cards: newCards };
            }
            return list;
          });

          const updatedBoard = { ...board, lists: newLists, updatedAt: new Date().toISOString() };

          return {
            boards: state.boards.map(b =>
              b.id === boardId ? updatedBoard : b
            ),
            currentBoard: state.currentBoard?.id === boardId
              ? updatedBoard
              : state.currentBoard
          };
        });

        // 发送AI事件
        const currentBoard = get().currentBoard;
        if (currentBoard) {
          aiEventSystem.sendCardEvent('moved', { 
            card, 
            sourceListId, 
            destListId, 
            boardId 
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // AI辅助功能
      checkProjectProgress: () => {
        const currentBoard = get().currentBoard;
        if (!currentBoard || !currentBoard.lists) return 0;
        
        const progress = aiEventSystem.checkProjectProgress(currentBoard);
        
        // 如果进度低于阈值，发送AI事件
        if (progress < 50) {
          aiEventSystem.sendProgressEvent(progress, currentBoard);
        }
        
        return progress;
      },
    }),
    {
      name: 'project-board-storage',
      partialize: (state) => ({
        boards: state.boards,
        currentBoard: state.currentBoard
      })
    }
  )
);