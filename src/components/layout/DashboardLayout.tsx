// src/components/layout/DashboardLayout.tsx
import { Sidebar } from './Sidebar';
import { ADMIN_NAV, CLIENT_NAV } from '@/config/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'client';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  // Lógica de decisión de contenido de la Sidebar
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
    <div className="min-h-screen bg-background text-text font-sans flex">
      <Sidebar 
        items={currentNav.items} 
        title={currentNav.title} 
        subtitle={currentNav.subtitle} 
      />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}