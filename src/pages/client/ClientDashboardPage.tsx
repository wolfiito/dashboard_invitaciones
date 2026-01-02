// src/pages/client/ClientDashboardPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  CheckCircle2, 
  UserPlus, 
  QrCode, 
  Clock,
  ChevronRight,
  AlertCircle,
  UserX,
  LucideIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guestService } from "@/services/guestService";
import { useAuthStore } from "@/store/useAuthStore";
import { motion } from "framer-motion";

// --- INTERFACES DE TIPADO ESTRICTO ---
interface InsightCardProps {
  title: string;
  value: number | string;
  total?: number;
  icon: LucideIcon;
  iconColor: string;
  description: string;
  showProgress?: boolean;
  progressColor?: string;
}

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const { clientEvent } = useAuthStore();
  
  // Estado inicial de métricas
  const [metrics, setMetrics] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    declined: 0,
    unassigned: 0
  });

  useEffect(() => {
    if (!clientEvent?.id) return;

    const unsubscribeGuests = guestService.subscribeByEvent(clientEvent.id, (guests) => {
      let total = 0;
      let confirmed = 0;
      let declined = 0;
      let pending = 0;
      let unassigned = 0;

      guests.forEach(guest => {
        const members = guest.members || [];
        total += members.length;

        // LÓGICA DE NEGOCIO CORREGIDA:
        // 1. Si el grupo está pendiente, todos los miembros son pendientes.
        if (guest.status === 'pending') {
          pending += members.length;
        } 
        // 2. Si el grupo ya respondió (ya sea 'confirmed' o 'declined')
        else {
          members.forEach(member => {
            if (member.isConfirmed) {
              confirmed++;
              // Solo contamos como "sin mesa" a los que SÍ confirmaron que van
              if (!member.tableId) unassigned++;
            } else {
              // Si el grupo respondió pero este miembro no está confirmado, es un "No irá"
              declined++;
            }
          });
        }
      });

      setMetrics({ total, confirmed, pending, declined, unassigned });
    });

    return () => unsubscribeGuests();
  }, [clientEvent?.id]);

  if (!clientEvent) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/20 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Centro de Mando</h1>
          <p className="text-secondary font-medium">Gestionando: {clientEvent.name}</p>
        </div>
        <button 
          onClick={() => navigate('/client/guests')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} />
          Añadir Invitados
        </button>
      </div>

      {/* GRID DE INSIGHTS: MÉTRICAS REALES INDIVIDUALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard 
          title="Confirmados"
          value={metrics.confirmed}
          total={metrics.total}
          icon={CheckCircle2}
          iconColor="text-green-400"
          description="Irán al evento"
          showProgress
          progressColor="bg-green-500"
        />
        <InsightCard 
          title="Pendientes"
          value={metrics.pending}
          icon={AlertCircle}
          iconColor="text-yellow-400"
          description="Sin respuesta aún"
        />
        <InsightCard 
          title="No irán"
          value={metrics.declined}
          icon={UserX}
          iconColor="text-red-400"
          description="Lugares liberados"
        />
        <InsightCard 
          title="Sin Mesa"
          value={metrics.unassigned}
          icon={MapPin}
          iconColor="text-purple-400"
          description="Confirmados sin asiento"
        />
      </div>

      {/* OPERATIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/client/hostess')}
          className="lg:col-span-2 group relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-pink-500/10 via-slate-900 to-slate-900 border border-pink-500/20 cursor-pointer hover:border-pink-500/40 transition-all"
        >
          <div className="relative z-10 flex justify-between items-center">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                <QrCode size={28} />
              </div>
              <h3 className="text-2xl font-black text-white">Modo Hostess</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Acceso rápido para el día del evento. Escanea QR y confirma llegadas.
              </p>
            </div>
            <ChevronRight className="hidden md:block text-slate-700 group-hover:text-pink-400 group-hover:translate-x-2 transition-all" size={48} />
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Próximo Hito
            </h3>
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700">
              <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Cargando...</p>
              <p className="text-sm font-bold text-white">Revisa el itinerario</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/client/timeline')}
            className="mt-6 w-full py-3 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors uppercase"
          >
            Ver Itinerario
          </button>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value, total, icon: Icon, iconColor, description, showProgress, progressColor }: InsightCardProps) {
  const percentage = total ? (Number(value) / total) * 100 : 0;

  return (
    <Card className="bg-slate-900/40 border-slate-800 overflow-hidden relative group hover:border-slate-700 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center justify-between">
          {title}
          <Icon className={iconColor} size={16} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white tracking-tighter">{value}</span>
          {total && <span className="text-xs text-slate-500 font-bold">/ {total}</span>}
        </div>
        
        {showProgress && total ? (
          <div className="space-y-1.5">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`h-full ${progressColor} shadow-[0_0_10px_rgba(34,197,94,0.2)]`}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold text-right">{percentage.toFixed(0)}% DEL TOTAL</p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-medium leading-tight">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}