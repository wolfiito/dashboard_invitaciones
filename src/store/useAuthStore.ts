// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth'; // Tipo oficial de Firebase
import { EventData } from '@/services/eventService';

type UserRole = 'admin' | 'client' | null;

interface AuthState {
  user: User | null;           // Administrador autenticado vía Firebase
  clientEvent: EventData | null; // Evento cargado vía Token
  role: UserRole;
  isAuthenticated: boolean;
  
  // Acciones
  setAdminAuth: (user: User) => void;
  setClientAuth: (event: EventData) => void;
  updateCurrentEvent: (data: Partial<EventData>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      clientEvent: null,
      role: null,
      isAuthenticated: false,

      setAdminAuth: (user) => set({ 
        user, 
        role: 'admin', 
        isAuthenticated: true,
        clientEvent: null 
      }),

      setClientAuth: (event) => set({ 
        clientEvent: event, 
        role: 'client', 
        isAuthenticated: true,
        user: null 
      }),
    updateCurrentEvent: (data) => set((state) => ({
        clientEvent: state.clientEvent ? { ...state.clientEvent, ...data } : null
      })),
      logout: () => set({ 
        user: null, 
        clientEvent: null, 
        role: null, 
        isAuthenticated: false 
      }),
    }),
    { 
      name: 'auth-storage',
      // Solo persistimos lo necesario si fuera un objeto muy grande, 
      // pero el User de Firebase y EventData son manejables.
    }
  )
);