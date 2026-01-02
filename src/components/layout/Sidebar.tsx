// src/components/layout/Sidebar.tsx
import { LogOut, LucideIcon, User as UserIcon, Calendar } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
// import { Button } from '@/components/ui/button';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle: string;
  isOpen: boolean; // Para control móvil
  onClose: () => void; // Para cerrar tras clic en móvil
}

export function Sidebar({ items, title, subtitle, isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, clientEvent, role, logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside className={cn(
      "w-64 bg-surface border-r border-slate-800 flex flex-col h-screen fixed lg:sticky left-0 top-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Header del Sidebar */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-primary tracking-tight">
          {title}<span className="text-white">{subtitle}</span>
        </h1>
      </div>

      {/* Navegación - Los links ahora cierran el menú en móvil */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]" 
                : "text-secondary hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Perfil y Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            {role === 'admin' ? (
              <UserIcon className="w-4 h-4 text-primary" />
            ) : (
              <Calendar className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {role === 'admin' ? user?.email : clientEvent?.name}
            </p>
            <p className="text-[10px] text-secondary uppercase tracking-widest font-bold">
              {role === 'admin' ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}