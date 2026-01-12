import { create } from 'zustand';

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  targetDate: string | null;
  progress: number;
  tasks: { id: string; title: string; status: string }[];
  createdAt: string;
}

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  selectedGoal: Goal | null;
  isEditing: boolean;

  loadGoals: (status?: GoalStatus) => Promise<void>;
  createGoal: (data: { title: string; description?: string; targetDate?: string }) => Promise<Goal>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  setSelectedGoal: (goal: Goal | null) => void;
  setIsEditing: (editing: boolean) => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,
  selectedGoal: null,
  isEditing: false,

  loadGoals: async (status?: GoalStatus) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      
      const response = await fetch(`/api/goals?${params}`);
      const goals = await response.json();
      set({ goals, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load goals', isLoading: false });
    }
  },

  createGoal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const goal = await response.json();
      set((state) => ({
        goals: [{ ...goal, progress: 0, tasks: [] }, ...state.goals],
        isLoading: false,
      }));
      return goal;
    } catch (error) {
      set({ error: 'Failed to create goal', isLoading: false });
      throw error;
    }
  },

  updateGoal: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updatedGoal = await response.json();
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
        selectedGoal: state.selectedGoal?.id === id ? { ...state.selectedGoal, ...updatedGoal } : state.selectedGoal,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update goal', isLoading: false });
      throw error;
    }
  },

  deleteGoal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        selectedGoal: state.selectedGoal?.id === id ? null : state.selectedGoal,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete goal', isLoading: false });
      throw error;
    }
  },

  setSelectedGoal: (goal) => set({ selectedGoal: goal, isEditing: false }),
  setIsEditing: (editing) => set({ isEditing: editing }),
}));
