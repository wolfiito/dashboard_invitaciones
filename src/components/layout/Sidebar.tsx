import { LogOut, LucideIcon, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ items, title, subtitle, isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { logout, clientEvent } = useAuthStore();

  const handleLogout = () => {
    if (confirm("¿Cerrar sesión?")) {
        logout();
        navigate('/login', { replace: true });
    }
  };

  return (
    <>
      {/* OVERLAY PARA MÓVIL */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* ASIDE: h-[100dvh] arregla el corte en móviles */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-[100dvh] w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* HEADER */}
        <div className="p-6 flex justify-between items-center shrink-0">
          <h1 className="text-2xl font-black text-primary tracking-tighter">
            {title}<span className="text-slate-700">{subtitle}</span>
          </h1>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-slate-500">
            <X size={24} />
          </Button>
        </div>

        {/* PERFIL (Scrollable si es necesario) */}
        {clientEvent && (
          <div className="px-6 mb-4 shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {clientEvent.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-800">{clientEvent.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Panel Cliente</p>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGACIÓN SCROLLABLE */}
        {/* flex-1 y overflow-y-auto permiten scroll si hay muchos items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", ({ isActive }: {isActive: boolean}) => isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* FOOTER FIXED AT BOTTOM */}
        <div className="p-4 mt-auto border-t border-slate-100 shrink-0 bg-white">
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold">Salir</span>
          </Button>
        </div>
      </aside>
    </>
  );
}