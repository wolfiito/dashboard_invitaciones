// src/components/layout/DashboardLayout.tsx
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ADMIN_NAV, CLIENT_NAV } from '@/config/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'client';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const { clientEvent } = useAuthStore();

  const navConfig = {
    admin: {
      items: ADMIN_NAV,
      title: "Event",
      subtitle: "OS"
    },
    client: {
      items: CLIENT_NAV,
      title: clientEvent?.name || "Gestor",
      subtitle: "Boda"
    }
  };

  const currentNav = navConfig[role];

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col lg:flex-row">
      {/* Botón de Menú Móvil (Solo visible en pantallas < lg) */}
      <header className="lg:hidden h-16 border-b border-slate-800 bg-surface flex items-center justify-between px-4 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-primary">
          {currentNav.title}<span className="text-white">{currentNav.subtitle}</span>
        </h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-secondary hover:text-white"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Overlay para cerrar el sidebar al tocar fuera en móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar con lógica responsiva */}
      <Sidebar 
        items={currentNav.items} 
        title={currentNav.title} 
        subtitle={currentNav.subtitle} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 p-4 lg:p-8 w-full transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}