// src/pages/client/ClientDashboardPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  CheckCircle2, 
  UserPlus, 
  AlertCircle,
  UserX,
  LucideIcon,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guestService, GuestData } from "@/services/guestService";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal"; // Asumiendo que tienes este componente
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Tipos para las categorías
type DashboardCategory = 'confirmed' | 'pending' | 'declined' | 'unassigned' | null;

interface InsightCardProps {
  title: string;
  value: number | string;
  total?: number;
  icon: LucideIcon;
  iconColor: string;
  description: string;
  showProgress?: boolean;
  progressColor?: string;
  onClick: () => void; // Nueva prop para manejar el clic
}

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const { clientEvent } = useAuthStore();
  
  // Estado de datos
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    declined: 0,
    unassigned: 0
  });

  // Estado del Modal de Detalles
  const [selectedCategory, setSelectedCategory] = useState<DashboardCategory>(null);

  useEffect(() => {
    if (!clientEvent?.id) return;

    const unsubscribeGuests = guestService.subscribeByEvent(clientEvent.id, (data) => {
      setGuests(data); // Guardamos la lista completa para filtrar después

      let total = 0;
      let confirmed = 0;
      let declined = 0;
      let pending = 0;
      let unassigned = 0;

      data.forEach(guest => {
        const members = guest.members || [];
        total += members.length;

        if (guest.status === 'pending') {
          pending += members.length;
        } else {
          members.forEach(member => {
            if (member.isConfirmed) {
              confirmed++;
              if (!member.tableId) unassigned++;
            } else {
              declined++;
            }
          });
        }
      });

      setMetrics({ total, confirmed, pending, declined, unassigned });
    });

    return () => unsubscribeGuests();
  }, [clientEvent?.id]);

  // --- LÓGICA DE FILTRADO PARA EL MODAL ---
  const getCategoryDetails = () => {
    if (!selectedCategory) return { title: "", list: [] };

    let list: { name: string; subtitle: string }[] = [];

    switch (selectedCategory) {
      case 'confirmed':
        list = guests.flatMap(g => 
          g.members.filter(m => m.isConfirmed).map(m => ({
            name: m.name,
            subtitle: g.type === 'family' ? `Fam. ${g.familyName}` : 'Individual'
          }))
        );
        return { title: "Invitados Confirmados", list, color: "text-green-500" };

      case 'pending':
        // En pendientes mostramos el grupo/familia entero generalmente
        list = guests.filter(g => g.status === 'pending').flatMap(g => 
          g.members.map(m => ({
            name: m.name,
            subtitle: `Esperando respuesta de Fam. ${g.familyName}`
          }))
        );
        return { title: "Pendientes de Respuesta", list, color: "text-yellow-500" };

      case 'declined':
        // Incluye grupos declinados completos O miembros individuales que dijeron no
        list = [];
        guests.forEach(g => {
          if (g.status === 'declined') {
             g.members.forEach(m => list.push({ name: m.name, subtitle: `Fam. ${g.familyName} (Declinó)` }));
          } else if (g.status === 'confirmed') {
             // Grupo va, pero este miembro no
             g.members.filter(m => !m.isConfirmed).forEach(m => 
                list.push({ name: m.name, subtitle: `Fam. ${g.familyName} (No asistirá)` })
             );
          }
        });
        return { title: "No Asistirán", list, color: "text-red-500" };

      case 'unassigned':
        list = guests.flatMap(g => 
          g.members.filter(m => m.isConfirmed && !m.tableId).map(m => ({
            name: m.name,
            subtitle: "Falta asignar mesa"
          }))
        );
        return { title: "Sin Mesa Asignada", list, color: "text-purple-500" };
        
      default:
        return { title: "", list: [], color: "" };
    }
  };

  const modalContent = getCategoryDetails();

  if (!clientEvent) return null;

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Hola, {clientEvent.name}</h1>
          <p className="text-slate-400 font-medium text-sm">Toca las tarjetas para ver detalles</p>
        </div>
        
        <button 
          onClick={() => navigate('/client/guests')}
          className="w-full bg-primary hover:bg-primary/90 text-white p-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <UserPlus size={20} />
          Gestionar Invitados
        </button>
      </div>

      {/* GRID 2x2 INTERACTIVO */}
      <div className="grid grid-cols-2 gap-4">
        <InsightCard 
          onClick={() => setSelectedCategory('confirmed')}
          title="Confirmados"
          value={metrics.confirmed}
          total={metrics.total}
          icon={CheckCircle2}
          iconColor="text-green-400"
          description="Ver lista"
          showProgress
          progressColor="bg-green-500"
        />
        
        <InsightCard 
          onClick={() => setSelectedCategory('pending')}
          title="Pendientes"
          value={metrics.pending}
          icon={AlertCircle}
          iconColor="text-yellow-400"
          description="Ver lista"
        />
        
        <InsightCard 
          onClick={() => setSelectedCategory('declined')}
          title="No asistirán"
          value={metrics.declined}
          icon={UserX}
          iconColor="text-red-400"
          description="Ver lista"
        />
        
        <InsightCard 
          onClick={() => setSelectedCategory('unassigned')}
          title="Sin Mesa"
          value={metrics.unassigned}
          icon={MapPin}
          iconColor="text-purple-400"
          description="Ver lista"
        />
      </div>

      {/* MODAL DE DETALLES */}
      <AnimatePresence>
        {selectedCategory && (
          <Modal 
            isOpen={!!selectedCategory} 
            onClose={() => setSelectedCategory(null)} 
            title={modalContent.title}
          >
            <div className="space-y-4">
              <div className={cn("text-xs font-bold uppercase tracking-widest mb-4", modalContent.color)}>
                {modalContent.list.length} Personas en total
              </div>

              {/* LISTA SCROLLEABLE */}
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                {modalContent.list.length > 0 ? (
                  modalContent.list.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No hay personas en esta categoría.
                  </div>
                )}
              </div>

              <Button onClick={() => setSelectedCategory(null)} className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold">
                Cerrar
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// COMPONENTE TARJETA ACTUALIZADO
function InsightCard({ onClick, title, value, total, icon: Icon, iconColor, showProgress, progressColor }: InsightCardProps) {
  const percentage = total ? (Number(value) / total) * 100 : 0;

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card 
        onClick={onClick}
        className="bg-slate-900/40 border-slate-800 overflow-hidden relative group hover:border-slate-600 transition-all cursor-pointer h-full active:bg-slate-800/60"
      >
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between mb-1">
            {title}
            <Icon className={iconColor} size={16} />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
            {total && <span className="text-[10px] text-slate-500 font-bold">/ {total}</span>}
          </div>
          
          {showProgress && total ? (
            <div className="space-y-1">
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className={`h-full ${progressColor}`}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-primary">
              <p className="text-[10px] font-bold leading-tight truncate">Ver detalles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}