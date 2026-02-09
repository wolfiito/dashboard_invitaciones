import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  CheckCircle2, 
  UserPlus, 
  AlertCircle,
  UserX,
  LucideIcon,
  User,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guestService, GuestData } from "@/services/guestService";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
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
  onClick: () => void;
  bgClass?: string;
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

  // Estado del Modal
  const [selectedCategory, setSelectedCategory] = useState<DashboardCategory>(null);

  useEffect(() => {
    if (!clientEvent?.id) return;

    const unsubscribeGuests = guestService.subscribeByEvent(clientEvent.id, (data) => {
      setGuests(data);

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

  // Lógica de detalles
  const getCategoryDetails = () => {
    if (!selectedCategory) return { title: "", list: [], color: "" };

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
        list = guests.filter(g => g.status === 'pending').flatMap(g => 
          g.members.map(m => ({
            name: m.name,
            subtitle: `Esperando: Fam. ${g.familyName}`
          }))
        );
        return { title: "Pendientes de Respuesta", list, color: "text-yellow-500" };

      case 'declined':
        list = [];
        guests.forEach(g => {
          if (g.status === 'declined') {
             g.members.forEach(m => list.push({ name: m.name, subtitle: `Fam. ${g.familyName} (Declinó)` }));
          } else if (g.status === 'confirmed') {
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
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col gap-2 pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Hola, {clientEvent.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Aquí tienes el resumen de tu evento en tiempo real.
        </p>
      </div>
      
      {/* ACTION BUTTON */}
      <Button 
        onClick={() => navigate('/client/guests')}
        size="lg"
        className="w-full h-14 text-base shadow-lg shadow-primary/20 rounded-2xl gap-3"
      >
        <UserPlus size={20} />
        Gestionar Invitados
      </Button>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Guests (Span 2 columns) */}
        <div className="col-span-2">
           <InsightCard 
            onClick={() => {}} // Total no abre modal por ahora
            title="Total Invitados"
            value={metrics.total}
            icon={Users}
            iconColor="text-primary"
            bgClass="bg-card/50"
          />
        </div>

        <InsightCard 
          onClick={() => setSelectedCategory('confirmed')}
          title="Confirmados"
          value={metrics.confirmed}
          total={metrics.total}
          icon={CheckCircle2}
          iconColor="text-green-500"
        />
        
        <InsightCard 
          onClick={() => setSelectedCategory('pending')}
          title="Pendientes"
          value={metrics.pending}
          icon={AlertCircle}
          iconColor="text-yellow-500"
        />
        
        <InsightCard 
          onClick={() => setSelectedCategory('declined')}
          title="No asistirán"
          value={metrics.declined}
          icon={UserX}
          iconColor="text-red-500"
        />
        
        <InsightCard 
          onClick={() => setSelectedCategory('unassigned')}
          title="Sin Mesa"
          value={metrics.unassigned}
          icon={MapPin}
          iconColor="text-purple-500"
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
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-sm text-muted-foreground font-medium">Total en lista</span>
                <span className={cn("text-lg font-bold", modalContent.color)}>
                  {modalContent.list.length}
                </span>
              </div>

              {/* LISTA SCROLLEABLE */}
              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                {modalContent.list.length > 0 ? (
                  modalContent.list.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <UserX size={32} className="opacity-20" />
                    <p className="text-sm">No hay personas en esta categoría.</p>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => setSelectedCategory(null)} className="w-full">
                Cerrar
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// COMPONENTE TARJETA OPTIMIZADO
function InsightCard({ onClick, title, value, total, icon: Icon, iconColor, bgClass }: InsightCardProps) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} className="h-full">
      <Card 
        onClick={onClick}
        className={cn(
          "cursor-pointer h-full border-border/50 hover:border-primary/50 transition-all shadow-sm hover:shadow-md overflow-hidden relative",
          bgClass
        )}
      >
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          <Icon className={cn("h-4 w-4 opacity-80", iconColor)} />
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
            {total !== undefined && (
              <span className="text-xs text-muted-foreground font-medium">/ {total}</span>
            )}
          </div>
        </CardContent>
        {/* Decorative gradient overlay */}
        <div className={cn("absolute bottom-0 left-0 right-0 h-1 opacity-20", iconColor.replace('text-', 'bg-'))} />
      </Card>
    </motion.div>
  );
}