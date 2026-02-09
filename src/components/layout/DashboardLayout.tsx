import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ADMIN_NAV, CLIENT_NAV } from '@/config/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'client';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navConfig = {
    admin: { items: ADMIN_NAV, title: "Event", subtitle: "OS" },
    client: { items: CLIENT_NAV, title: "Gestor", subtitle: "Boda" }
  };

  const currentNav = navConfig[role];

  return (
    // Eliminamos text-black y usamos el fondo semántico
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col lg:flex-row">
      
      {/* HEADER MÓVIL: Ahora con Glassmorphism real */}
      <header className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tighter text-primary">
          {currentNav.title}<span className="text-foreground">{currentNav.subtitle}</span>
        </h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
          className="text-muted-foreground"
        >
          <Menu size={24} />
        </Button>
      </header>

      {/* SIDEBAR: Lo inyectamos con las nuevas props */}
      <Sidebar 
        items={currentNav.items} 
        title={currentNav.title} 
        subtitle={currentNav.subtitle}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* CONTENIDO PRINCIPAL: Optimizado para lectura y espaciado */}
      <main className="flex-1 w-full lg:ml-64 transition-all duration-300">
        <div className="max-w-5xl mx-auto p-6 md:p-10 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}