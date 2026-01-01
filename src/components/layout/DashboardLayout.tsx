import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-text font-sans flex">
      {/* Sidebar Fija */}
      <Sidebar />

      {/* Área Principal de Contenido */}
      {/* ml-64 empuja el contenido para no quedar debajo de la sidebar */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}