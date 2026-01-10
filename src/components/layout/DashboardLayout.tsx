// src/components/layout/DashboardLayout.tsx
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ADMIN_NAV, CLIENT_NAV } from '@/config/navigation';
import { Menu } from 'lucide-react'; // Importamos icono de menú

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'client';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navConfig = {
    admin: {
      items: ADMIN_NAV,
      title: "Event",
      subtitle: "OS"
    },
    client: {
      items: CLIENT_NAV,
      title: "Gestor",
      subtitle: "Boda"
    }
  };

  const currentNav = navConfig[role];

  return (
    <div className="min-h-screen text-black font-sans flex flex-col lg:flex-row">
      
      {/* HEADER MÓVIL (Solo visible en pantallas pequeñas) */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">
          {currentNav.title}<span className="text-white">{currentNav.subtitle}</span>
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg active:scale-95 transition-transform"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* SIDEBAR RESPONSIVO */}
      <Sidebar 
        items={currentNav.items} 
        title={currentNav.title} 
        subtitle={currentNav.subtitle}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* CONTENIDO PRINCIPAL */}
      {/* En móvil: ml-0 (sin margen). En Desktop: lg:ml-64 (espacio para sidebar) */}
      <main className="flex-1 w-full transition-all duration-300 lg:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}