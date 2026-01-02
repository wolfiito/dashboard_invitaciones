import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Importar createJSONStorage
import { User } from 'firebase/auth';
import { EventData } from '@/services/eventService';

type UserRole = 'admin' | 'client' | null;

interface AuthState {
  user: User | null;
  clientEvent: EventData | null;
  role: UserRole;
  isAuthenticated: boolean;
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

      // FIX: Limpieza profunda al cerrar sesión
      logout: () => {
        set({ user: null, clientEvent: null, role: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage'); // Borrado manual del persist
        sessionStorage.clear(); // Por si acaso
      },
    }),
    { 
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage), // Asegurar que usa localStorage
    }
  )
);