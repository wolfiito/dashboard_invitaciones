import { LayoutDashboard, CalendarDays, Users, Settings, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom'; // <--- Importante
import { cn } from '@/lib/utils'; // <--- Usamos nuestra utilidad

export function Sidebar() {
  // Agregamos la propiedad 'path' a cada item
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: CalendarDays, label: 'Eventos', path: '/events' },
    { icon: Users, label: 'Invitados', path: '/guests' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-slate-700 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-primary tracking-tight">
          Event<span className="text-white">OS</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-secondary hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-secondary hover:text-red-400 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}