// src/config/navigation.ts
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Settings, 
  Clock, 
  MapPin, 
  Gift, 
  QrCode, 
  TableProperties 
} from 'lucide-react';

export const ADMIN_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarDays, label: 'Eventos', path: '/events' },
  { icon: Users, label: 'Invitados Global', path: '/guests' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const CLIENT_NAV = [
  { icon: LayoutDashboard, label: 'Inicio', path: '/client/dashboard' },
  { icon: Users, label: 'Mis Invitados', path: '/client/guests' },
  { icon: TableProperties, label: 'Mesas', path: '/client/tables' },
  { icon: Clock, label: 'Itinerario', path: '/client/timeline' },
  { icon: MapPin, label: 'Ubicación', path: '/client/location' },
  { icon: Gift, label: 'Regalos', path: '/client/gift' },
  { icon: QrCode, label: 'Modo Hostess', path: '/client/hostess' },
];