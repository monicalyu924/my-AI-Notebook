import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { boardApi, listApi, cardApi } from '../utils/projectApi';
import NotificationProvider, { useNotification } from '../components/feedback/NotificationSystem';

const ProjectContext = createContext();

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_BOARDS: 'SET_BOARDS',
  SET_CURRENT_BOARD: 'SET_CURRENT_BOARD',
  ADD_BOARD: 'ADD_BOARD',
  UPDATE_BOARD: 'UPDATE_BOARD',
  DELETE_BOARD: 'DELETE_BOARD',
  ADD_LIST: 'ADD_LIST',
  UPDATE_LIST: 'UPDATE_LIST',
  DELETE_LIST: 'DELETE_LIST',
  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  SET_ERROR: 'SET_ERROR'
};

// Initial state
const initialState = {
  loading: false,
  boards: [],
  currentBoard: null,
  error: null
};

// Reducer
function projectReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ACTIONS.SET_BOARDS:
      return { ...state, boards: action.payload };
      
    case ACTIONS.SET_CURRENT_BOARD:
      return { ...state, currentBoard: action.payload };
      
    case ACTIONS.ADD_BOARD:
      return { ...state, boards: [action.payload, ...state.boards] };
      
    case ACTIONS.UPDATE_BOARD:
      return {
        ...state,
        boards: state.boards.map(board => 
          board.id === action.payload.id ? action.payload : board
        ),
        currentBoard: state.currentBoard?.id === action.payload.id 
          ? { ...state.currentBoard, ...action.payload }
          : state.currentBoard
      };
      
    case ACTIONS.DELETE_BOARD:
      return {
        ...state,
        boards: state.boards.filter(board => board.id !== action.payload),
        currentBoard: state.currentBoard?.id === action.payload ? null : state.currentBoard
      };
      
    case ACTIONS.ADD_LIST:
      if (state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          lists: [...state.currentBoard.lists, { ...action.payload, cards: [] }]
        };
        return { ...state, currentBoard: updatedBoard };
      }
      return state;
      
    case ACTIONS.UPDATE_LIST:
      if (state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map(list => 
            list.id === action.payload.id ? { ...list, ...action.payload } : list
          )
        };
        return { ...state, currentBoard: updatedBoard };
      }
      return state;
      
    case ACTIONS.DELETE_LIST:
      if (state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          lists: state.currentBoard.lists.filter(list => list.id !== action.payload)
        };
        return { ...state, currentBoard: updatedBoard };
      }
      return state;
      
    case ACTIONS.ADD_CARD:
      if (state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map(list => 
            list.id === action.payload.list_id 
              ? { ...list, cards: [...list.cards, action.payload] }
              : list
          )
        };
        return { ...state, currentBoard: updatedBoard };
      }
      return state;
      
    case ACTIONS.UPDATE_CARD:
      if (state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map(list => ({
            ...list,
            cards: list.cards.map(card => 
              card.id === action.payload.id ? action.payload : card
            ).filter(card => card.list_id === list.id)
          }))
        };
        return { ...state, currentBoard: updatedBoard };
      }
      return state;
      
    case ACTIONS.DELETE_CARD:
      if (state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map(list => ({
            ...list,
            cards: list.cards.filter(card => card.id !== action.payload)
          }))
        };
        return { ...state, currentBoard: updatedBoard };
      }
      return state;
      
    case ACTIONS.MOVE_CARD:
      if (state.currentBoard) {
        const { cardId, targetListId, position } = action.payload;
        let cardToMove = null;
        
        // 先从所有列表中找到并移除卡片
        const listsWithoutCard = state.currentBoard.lists.map(list => ({
          ...list,
          cards: list.cards.filter(card => {
            if (card.id === cardId) {
              cardToMove = { ...card, list_id: targetListId, position };
              return false;
            }
            return true;
          })
        }));
        
        // 然后将卡片添加到目标列表
        const updatedLists = listsWithoutCard.map(list => 
          list.id === targetListId && cardToMove
            ? { ...list, cards: [...list.cards, cardToMove] }
            : list
        );
        
        const updatedBoard = { ...state.currentBoard, lists: updatedLists };
        return { ...state, currentBoard: updatedBoard };
      }
      return state;
      
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
      
    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { success, error } = useNotification();

  // 加载看板列表
  const loadBoards = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const boards = await boardApi.getBoards();
      dispatch({ type: ACTIONS.SET_BOARDS, payload: boards });
    } catch (err) {
      console.error('Failed to load boards:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
      error('加载看板失败');
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [error]);

  // 加载看板详情
  const loadBoardWithData = useCallback(async (boardId) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const board = await boardApi.getBoardWithData(boardId);
      dispatch({ type: ACTIONS.SET_CURRENT_BOARD, payload: board });
    } catch (err) {
      console.error('Failed to load board:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
      error('加载看板详情失败');
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [error]);

  // 创建看板
  const createBoard = useCallback(async (boardData) => {
    try {
      const newBoard = await boardApi.createBoard(boardData);
      dispatch({ type: ACTIONS.ADD_BOARD, payload: newBoard });
      success('看板创建成功');
      return newBoard;
    } catch (err) {
      console.error('Failed to create board:', err);
      error('创建看板失败');
      throw err;
    }
  }, [success, error]);

  // 更新看板
  const updateBoard = useCallback(async (boardId, boardData) => {
    try {
      const updatedBoard = await boardApi.updateBoard(boardId, boardData);
      dispatch({ type: ACTIONS.UPDATE_BOARD, payload: updatedBoard });
      success('看板更新成功');
      return updatedBoard;
    } catch (err) {
      console.error('Failed to update board:', err);
      error('更新看板失败');
      throw err;
    }
  }, [success, error]);

  // 删除看板
  const deleteBoard = useCallback(async (boardId) => {
    try {
      await boardApi.deleteBoard(boardId);
      dispatch({ type: ACTIONS.DELETE_BOARD, payload: boardId });
      success('看板删除成功');
    } catch (err) {
      console.error('Failed to delete board:', err);
      error('删除看板失败');
      throw err;
    }
  }, [success, error]);

  // 创建列表
  const createList = useCallback(async (boardId, listData) => {
    try {
      const newList = await listApi.createList(boardId, listData);
      dispatch({ type: ACTIONS.ADD_LIST, payload: newList });
      success('列表创建成功');
      return newList;
    } catch (err) {
      console.error('Failed to create list:', err);
      error('创建列表失败');
      throw err;
    }
  }, [success, error]);

  // 更新列表
  const updateList = useCallback(async (listId, listData) => {
    try {
      const updatedList = await listApi.updateList(listId, listData);
      dispatch({ type: ACTIONS.UPDATE_LIST, payload: updatedList });
      return updatedList;
    } catch (err) {
      console.error('Failed to update list:', err);
      error('更新列表失败');
      throw err;
    }
  }, [error]);

  // 删除列表
  const deleteList = useCallback(async (listId) => {
    try {
      await listApi.deleteList(listId);
      dispatch({ type: ACTIONS.DELETE_LIST, payload: listId });
      success('列表删除成功');
    } catch (err) {
      console.error('Failed to delete list:', err);
      error('删除列表失败');
      throw err;
    }
  }, [success, error]);

  // 创建卡片
  const createCard = useCallback(async (listId, cardData) => {
    try {
      const newCard = await cardApi.createCard(listId, cardData);
      dispatch({ type: ACTIONS.ADD_CARD, payload: newCard });
      success('卡片创建成功');
      return newCard;
    } catch (err) {
      console.error('Failed to create card:', err);
      error('创建卡片失败');
      throw err;
    }
  }, [success, error]);

  // 更新卡片
  const updateCard = useCallback(async (cardId, cardData) => {
    try {
      const updatedCard = await cardApi.updateCard(cardId, cardData);
      dispatch({ type: ACTIONS.UPDATE_CARD, payload: updatedCard });
      return updatedCard;
    } catch (err) {
      console.error('Failed to update card:', err);
      error('更新卡片失败');
      throw err;
    }
  }, [error]);

  // 删除卡片
  const deleteCard = useCallback(async (cardId) => {
    try {
      await cardApi.deleteCard(cardId);
      dispatch({ type: ACTIONS.DELETE_CARD, payload: cardId });
      success('卡片删除成功');
    } catch (err) {
      console.error('Failed to delete card:', err);
      error('删除卡片失败');
      throw err;
    }
  }, [success, error]);

  // 移动卡片
  const moveCard = useCallback(async (cardId, targetListId, position) => {
    // 先更新本地状态
    dispatch({ 
      type: ACTIONS.MOVE_CARD, 
      payload: { cardId, targetListId, position } 
    });
    
    // 然后同步到服务器
    try {
      await cardApi.updateCard(cardId, { list_id: targetListId, position });
    } catch (err) {
      console.error('Failed to move card:', err);
      error('移动卡片失败');
      // TODO: 回滚本地状态
      throw err;
    }
  }, [error]);

  const value = {
    ...state,
    loadBoards,
    loadBoardWithData,
    createBoard,
    updateBoard,
    deleteBoard,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    moveCard
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}