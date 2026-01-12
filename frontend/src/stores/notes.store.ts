import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface Note {
  id: string;
  title: string | null;
  content: string;
  category: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  count: number;
}

interface NotesState {
  notes: Note[];
  categories: Category[];
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  selectedNote: Note | null;
  isEditing: boolean;

  // Actions
  loadNotes: (category?: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  createNote: (data: { title?: string; content: string; category?: string; tags?: string[] }) => Promise<Note>;
  updateNote: (id: string, data: { title?: string; content?: string; category?: string; tags?: string[] }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedNote: (note: Note | null) => void;
  setIsEditing: (editing: boolean) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  categories: [],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  selectedNote: null,
  isEditing: false,

  loadNotes: async (category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      
      const response = await fetch(`${API_BASE}/api/notes?${params}`);
      const data = await response.json();
      set({ notes: data.notes, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load notes', isLoading: false });
    }
  },

  loadCategories: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/categories`);
      const categories = await response.json();
      set({ categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  },

  searchNotes: async (query: string) => {
    if (!query.trim()) {
      get().loadNotes(get().selectedCategory || undefined);
      return;
    }
    
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      const response = await fetch(`${API_BASE}/api/notes/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const notes = await response.json();
      set({ notes, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to search notes', isLoading: false });
    }
  },

  createNote: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const note = await response.json();
      set((state) => ({
        notes: [note, ...state.notes],
        isLoading: false,
      }));
      get().loadCategories(); // Refresh categories
      return note;
    } catch (error) {
      set({ error: 'Failed to create note', isLoading: false });
      throw error;
    }
  },

  updateNote: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updatedNote = await response.json();
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
        selectedNote: state.selectedNote?.id === id ? updatedNote : state.selectedNote,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update note', isLoading: false });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`${API_BASE}/api/notes/${id}`, { method: 'DELETE' });
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
        isLoading: false,
      }));
      get().loadCategories(); // Refresh categories
    } catch (error) {
      set({ error: 'Failed to delete note', isLoading: false });
      throw error;
    }
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category, searchQuery: '' });
    get().loadNotes(category || undefined);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedNote: (note) => set({ selectedNote: note, isEditing: false }),

  setIsEditing: (editing) => set({ isEditing: editing }),
}));
