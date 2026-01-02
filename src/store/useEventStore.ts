// src/store/useEventStore.ts
import { create } from 'zustand';
import { EventData } from '@/services/eventService';

interface EventState {
  currentEvent: EventData | null;
  isLoading: boolean;
  error: string | null;
  // Acciones
  setCurrentEvent: (event: EventData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateCurrentEvent: (data: Partial<EventData>) => void;
}

export const useEventStore = create<EventState>((set) => ({
  currentEvent: null,
  isLoading: false,
  error: null,

  setCurrentEvent: (event) => set({ currentEvent: event, error: null }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error: error }),

  updateCurrentEvent: (data) => 
    set((state) => ({
      currentEvent: state.currentEvent 
        ? { ...state.currentEvent, ...data } 
        : null
    })),
}));