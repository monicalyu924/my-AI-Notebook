import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useBoardStore = create(
  persist(
    (set, get) => ({
      boards: [],
      currentBoard: null,
      
      createBoard: (boardData) => {
        const newBoard = {
          id: Date.now(),
          lists: [
            { id: 'todo', title: '待办', cards: [] },
            { id: 'inprogress', title: '进行中', cards: [] },
            { id: 'done', title: '已完成', cards: [] }
          ],
          createdAt: new Date().toISOString(),
          ...boardData
        }
        
        set((state) => ({
          boards: [...state.boards, newBoard],
          currentBoard: newBoard
        }))
        
        return newBoard
      },
      
      updateBoard: (boardId, updates) => {
        set((state) => ({
          boards: state.boards.map(board =>
            board.id === boardId ? { ...board, ...updates } : board
          ),
          currentBoard: state.currentBoard?.id === boardId
            ? { ...state.currentBoard, ...updates }
            : state.currentBoard
        }))
      },
      
      addCard: (listId, cardData) => {
        const { currentBoard, updateBoard } = get()
        if (!currentBoard) return
        
        const newCard = {
          id: Date.now(),
          createdAt: new Date().toISOString(),
          ...cardData
        }
        
        const updatedLists = currentBoard.lists.map(list =>
          list.id === listId
            ? { ...list, cards: [...list.cards, newCard] }
            : list
        )
        
        updateBoard(currentBoard.id, { lists: updatedLists })
      },
      
      moveCard: (cardId, fromListId, toListId, newIndex) => {
        const { currentBoard, updateBoard } = get()
        if (!currentBoard) return
        
        const fromList = currentBoard.lists.find(list => list.id === fromListId)
        const toList = currentBoard.lists.find(list => list.id === toListId)
        const card = fromList?.cards.find(card => card.id === cardId)
        
        if (!card || !fromList || !toList) return
        
        const updatedLists = currentBoard.lists.map(list => {
          if (list.id === fromListId) {
            return {
              ...list,
              cards: list.cards.filter(c => c.id !== cardId)
            }
          } else if (list.id === toListId) {
            const newCards = [...list.cards]
            newCards.splice(newIndex, 0, card)
            return {
              ...list,
              cards: newCards
            }
          }
          return list
        })
        
        updateBoard(currentBoard.id, { lists: updatedLists })
      },
      
      setCurrentBoard: (board) => set({ currentBoard: board })
    }),
    {
      name: 'board-storage'
    }
  )
)