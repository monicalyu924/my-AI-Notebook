import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notesAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import { debounce } from '../utils/performance';

const NotesContext = createContext();

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState(null); // 当前文件夹ID
  const [searchResults, setSearchResults] = useState([]); // 全文搜索结果
  const [isSearching, setIsSearching] = useState(false); // 是否正在搜索

  // Fetch notes when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    } else {
      setNotes([]);
      setSelectedNote(null);
    }
  }, [isAuthenticated]);

  const fetchNotes = async (folderId = null) => {
    setIsLoading(true);
    try {
      const response = await notesAPI.getNotes(folderId);
      setNotes(response.data);
      setCurrentFolderId(folderId);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (noteData) => {
    try {
      const response = await notesAPI.createNote(noteData);
      const newNote = response.data;
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      return { success: true, note: newNote };
    } catch (error) {
      console.error('Failed to create note:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to create note' };
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      const response = await notesAPI.updateNote(id, noteData);
      const updatedNote = response.data;
      
      setNotes(prev => 
        prev.map(note => note.id === id ? updatedNote : note)
      );
      
      if (selectedNote?.id === id) {
        setSelectedNote(updatedNote);
      }
      
      return { success: true, note: updatedNote };
    } catch (error) {
      console.error('Failed to update note:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to update note' };
    }
  };

  const deleteNote = async (id) => {
    try {
      await notesAPI.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
      
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete note:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to delete note' };
    }
  };

  // 实际执行搜索的函数
  const performSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await notesAPI.searchNotes(query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search notes:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 防抖搜索 - 使用useCallback和useRef避免重复创建
  const debouncedSearchRef = useRef(debounce(performSearch, 300));

  // 全文搜索功能（带防抖）
  const searchNotes = useCallback((query) => {
    setSearchTerm(query);

    if (!query || query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // 使用防抖搜索
    debouncedSearchRef.current(query);
  }, []);

  // 清除搜索
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // 如果在搜索模式，使用搜索结果，否则使用本地过滤
  const filteredNotes = searchTerm && searchResults.length > 0
    ? searchResults
    : notes.filter(note =>
        searchTerm === '' ||
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  const value = {
    notes,
    filteredNotes,
    selectedNote,
    isLoading,
    searchTerm,
    currentFolderId,
    searchResults,
    isSearching,
    setSearchTerm,
    setSelectedNote,
    setCurrentFolderId,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    clearSearch,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
