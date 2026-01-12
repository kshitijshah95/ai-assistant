import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || '';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  streak: number;
  completedToday: boolean;
  createdAt: string;
}

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
  selectedHabit: Habit | null;

  loadHabits: () => Promise<void>;
  createHabit: (data: { name: string; frequency?: HabitFrequency }) => Promise<Habit>;
  logHabit: (id: string, notes?: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  setSelectedHabit: (habit: Habit | null) => void;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,
  selectedHabit: null,

  loadHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/habits`);
      const habits = await response.json();
      set({ habits, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load habits', isLoading: false });
    }
  },

  createHabit: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const habit = await response.json();
      set((state) => ({
        habits: [{ ...habit, streak: 0, completedToday: false }, ...state.habits],
        isLoading: false,
      }));
      return habit;
    } catch (error) {
      set({ error: 'Failed to create habit', isLoading: false });
      throw error;
    }
  },

  logHabit: async (id, notes) => {
    try {
      await fetch(`${API_BASE}/api/habits/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, notes }),
      });
      // Reload to get updated streak
      get().loadHabits();
    } catch (error) {
      set({ error: 'Failed to log habit' });
      throw error;
    }
  },

  deleteHabit: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`${API_BASE}/api/habits/${id}`, { method: 'DELETE' });
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        selectedHabit: state.selectedHabit?.id === id ? null : state.selectedHabit,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete habit', isLoading: false });
      throw error;
    }
  },

  setSelectedHabit: (habit) => set({ selectedHabit: habit }),
}));
