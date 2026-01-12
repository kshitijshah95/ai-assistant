import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || '';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  goalId: string | null;
  goal: { id: string; title: string } | null;
  createdAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
}

interface TasksState {
  tasks: Task[];
  stats: TaskStats | null;
  filterStatus: TaskStatus | 'all';
  isLoading: boolean;
  error: string | null;
  selectedTask: Task | null;
  isEditing: boolean;

  // Actions
  loadTasks: (status?: TaskStatus) => Promise<void>;
  loadStats: () => Promise<void>;
  loadTodayTasks: () => Promise<Task[]>;
  createTask: (data: { title: string; description?: string; priority?: TaskPriority; dueDate?: string }) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilterStatus: (status: TaskStatus | 'all') => void;
  setSelectedTask: (task: Task | null) => void;
  setIsEditing: (editing: boolean) => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  stats: null,
  filterStatus: 'all',
  isLoading: false,
  error: null,
  selectedTask: null,
  isEditing: false,

  loadTasks: async (status?: TaskStatus) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      
      const response = await fetch(`${API_BASE}/api/tasks?${params}`);
      const data = await response.json();
      set({ tasks: data.tasks, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load tasks', isLoading: false });
    }
  },

  loadStats: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/stats`);
      const stats = await response.json();
      set({ stats });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },

  loadTodayTasks: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/today`);
      return response.json();
    } catch (error) {
      console.error('Failed to load today tasks:', error);
      return [];
    }
  },

  createTask: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const task = await response.json();
      set((state) => ({
        tasks: [task, ...state.tasks],
        isLoading: false,
      }));
      get().loadStats();
      return task;
    } catch (error) {
      set({ error: 'Failed to create task', isLoading: false });
      throw error;
    }
  },

  updateTask: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updatedTask = await response.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        isLoading: false,
      }));
      get().loadStats();
    } catch (error) {
      set({ error: 'Failed to update task', isLoading: false });
      throw error;
    }
  },

  completeTask: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${id}/complete`, { method: 'POST' });
      const updatedTask = await response.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
      get().loadStats();
    } catch (error) {
      set({ error: 'Failed to complete task' });
      throw error;
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        isLoading: false,
      }));
      get().loadStats();
    } catch (error) {
      set({ error: 'Failed to delete task', isLoading: false });
      throw error;
    }
  },

  setFilterStatus: (status) => {
    set({ filterStatus: status });
    get().loadTasks(status === 'all' ? undefined : status);
  },

  setSelectedTask: (task) => set({ selectedTask: task, isEditing: false }),

  setIsEditing: (editing) => set({ isEditing: editing }),
}));
