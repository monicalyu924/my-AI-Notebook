import React, { createContext, useContext, useState, useEffect } from 'react';
import { notesAPI } from '../utils/api';
import { useAuth } from './AuthContext';

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

  // Filter notes based on search term
  const filteredNotes = notes.filter(note =>
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
    setSearchTerm,
    setSelectedNote,
    setCurrentFolderId,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};
