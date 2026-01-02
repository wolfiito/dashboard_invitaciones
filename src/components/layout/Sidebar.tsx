// src/components/layout/Sidebar.tsx
import { LogOut, LucideIcon, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle: string;
  isOpen: boolean;       // Control para móvil
  onClose: () => void;   // Función para cerrar
}

export function Sidebar({ items, title, subtitle, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* OVERLAY OSCURO (Solo móvil) */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* SIDEBAR */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out",
        // En móvil depende de isOpen, en Desktop (lg) siempre está visible (translate-x-0)
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            {title}<span className="text-white">{subtitle}</span>
          </h1>
          {/* Botón cerrar solo visible en móvil */}
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose} // Cierra el menú al navegar (UX móvil)
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", ({ isActive }: { isActive: boolean }) => isActive ? "text-white" : "text-slate-500 group-hover:text-primary")} />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}