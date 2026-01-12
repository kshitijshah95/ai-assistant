import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  recurrenceRule: string | null;
  createdAt: string;
}

type CalendarView = 'month' | 'week' | 'day';

interface CalendarState {
  events: CalendarEvent[];
  currentDate: Date;
  view: CalendarView;
  isLoading: boolean;
  error: string | null;
  selectedEvent: CalendarEvent | null;
  isEditing: boolean;

  loadEvents: () => Promise<void>;
  createEvent: (data: { title: string; description?: string; startTime: string; endTime: string }) => Promise<CalendarEvent>;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  setIsEditing: (editing: boolean) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  currentDate: new Date(),
  view: 'month',
  isLoading: false,
  error: null,
  selectedEvent: null,
  isEditing: false,

  loadEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentDate, view } = get();
      const params = new URLSearchParams();
      
      if (view === 'month') {
        params.set('view', 'month');
        params.set('year', currentDate.getFullYear().toString());
        params.set('month', currentDate.getMonth().toString());
      } else if (view === 'week') {
        params.set('view', 'week');
        params.set('start', currentDate.toISOString());
      } else {
        params.set('view', 'day');
        params.set('start', currentDate.toISOString());
      }

      const response = await fetch(`${API_BASE}/api/calendar?${params}`);
      const events = await response.json();
      set({ events, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load events', isLoading: false });
    }
  },

  createEvent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const event = await response.json();
      set((state) => ({
        events: [...state.events, event],
        isLoading: false,
      }));
      return event;
    } catch (error) {
      set({ error: 'Failed to create event', isLoading: false });
      throw error;
    }
  },

  updateEvent: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/calendar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updatedEvent = await response.json();
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        selectedEvent: state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update event', isLoading: false });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`${API_BASE}/api/calendar/${id}`, { method: 'DELETE' });
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete event', isLoading: false });
      throw error;
    }
  },

  setCurrentDate: (date) => {
    set({ currentDate: date });
    get().loadEvents();
  },

  setView: (view) => {
    set({ view });
    get().loadEvents();
  },

  setSelectedEvent: (event) => set({ selectedEvent: event, isEditing: false }),
  setIsEditing: (editing) => set({ isEditing: editing }),

  goToToday: () => {
    set({ currentDate: new Date() });
    get().loadEvents();
  },

  goToPrevious: () => {
    const { currentDate, view } = get();
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    
    set({ currentDate: newDate });
    get().loadEvents();
  },

  goToNext: () => {
    const { currentDate, view } = get();
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    set({ currentDate: newDate });
    get().loadEvents();
  },
}));
