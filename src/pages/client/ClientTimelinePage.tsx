import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Clock, ChevronDown, Star, Info, Loader2,
  CalendarDays, Wine, Camera, Utensils, Church, DoorOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService, TimelineItem } from "@/services/eventService";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

// Iconos (Usando Lucide para consistencia)
const AVAILABLE_ICONS = [
  { name: "Recepcion", Icon: DoorOpen, label: "Recepción" },
  { name: "Ceremonia", Icon: Church, label: "Ceremonia" },
  { name: "Comida", Icon: Utensils, label: "Comida" },
  { name: "Fotos", Icon: Camera, label: "Fotos" },
  { name: "Brindis", Icon: Wine, label: "Brindis" },
  { name: "Salida", Icon: DoorOpen, label: "Salida" }
];

export function ClientTimelinePage() {
  const navigate = useNavigate();
  const { clientEvent, updateCurrentEvent } = useAuthStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isIconMenuOpen, setIsIconMenuOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<TimelineItem, 'id'>>({
    time: "", title: "", description: "", icon: "Ceremonia"
  });

  const handleAddItem = async () => {
    if (!clientEvent || !newItem.time || !newItem.title) {
        toast.error("Completa hora y título");
        return;
    }
    setIsSaving(true);
    try {
      const updatedTimeline = [
        ...(clientEvent.timeline || []),
        { ...newItem, id: crypto.randomUUID() }
      ].sort((a, b) => a.time.localeCompare(b.time));

      await eventService.update(clientEvent.id!, { timeline: updatedTimeline });
      updateCurrentEvent({ timeline: updatedTimeline });
      toast.success("Actividad agregada");
      setNewItem({ time: "", title: "", description: "", icon: "Ceremonia" });
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!clientEvent?.timeline) return;
    if(confirm("¿Eliminar esta actividad?")) {
        const updatedTimeline = clientEvent.timeline.filter(item => item.id !== itemId);
        try {
            await eventService.update(clientEvent.id!, { timeline: updatedTimeline });
            updateCurrentEvent({ timeline: updatedTimeline });
            toast.success("Eliminado");
        } catch (e) { toast.error("Error al eliminar"); }
    }
  };

  const SelectedIconComponent = AVAILABLE_ICONS.find(i => i.name === newItem.icon)?.Icon || Star;
  if (!clientEvent) return null;

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500 max-w-3xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client/dashboard")} className="text-slate-400 lg:hidden">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900">Itinerario</h1>
            <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
               <CalendarDays size={14} /> {clientEvent.name}
            </p>
          </div>
        </div>
      </div>

      {/* FORMULARIO (CARD BLANCA) */}
      <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50 overflow-visible relative z-20">
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="time" 
                  value={newItem.time} 
                  onChange={e => setNewItem({...newItem, time: e.target.value})} 
                  className="pl-10 h-12 font-bold text-center bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                />
              </div>
            </div>
            <div className="md:col-span-9 space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actividad</Label>
              <Input 
                placeholder="Ej: Recepción" 
                value={newItem.title} 
                onChange={e => setNewItem({...newItem, title: e.target.value})} 
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-4 space-y-2 relative">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Icono</Label>
              <button
                type="button"
                onClick={() => setIsIconMenuOpen(!isIconMenuOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-primary transition-all h-12"
              >
                <div className="flex items-center gap-3">
                  <SelectedIconComponent size={20} className="text-primary" />
                  <span className="text-sm font-medium">{AVAILABLE_ICONS.find(i => i.name === newItem.icon)?.label}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isIconMenuOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isIconMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl p-2 grid grid-cols-2 gap-1"
                  >
                    {AVAILABLE_ICONS.map(({ name, Icon, label }) => (
                      <button
                        key={name}
                        onClick={() => { setNewItem({ ...newItem, icon: name }); setIsIconMenuOpen(false); }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all",
                          newItem.icon === name ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        <Icon size={16} /> {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="md:col-span-8 space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detalles</Label>
              <Input 
                placeholder="Ej: Salón Principal" 
                value={newItem.description} 
                onChange={e => setNewItem({...newItem, description: e.target.value})} 
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <Button 
            onClick={handleAddItem} 
            disabled={isSaving || !newItem.time || !newItem.title}
            className="w-full h-14 bg-primary hover:bg-primary/90 font-bold text-lg rounded-xl shadow-lg shadow-primary/20 text-white"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />}
            Agregar
          </Button>
        </CardContent>
      </Card>

      {/* TIMELINE LIST */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:left-6 md:before:left-1/2 before:w-0.5 before:bg-slate-200 before:z-0 py-4">
        <AnimatePresence mode="popLayout">
          {clientEvent.timeline?.map((item, index) => {
            const IconComponent = AVAILABLE_ICONS.find(i => i.name === item.icon)?.Icon || Star;
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn("relative z-10 flex items-center gap-6 md:gap-0 w-full", index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row")}
              >
                {/* ICONO CENTRAL */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-slate-50 shadow-md flex items-center justify-center text-primary z-20">
                    <IconComponent size={20} />
                </div>

                {/* TARJETA */}
                <div className="flex-1 pl-16 md:pl-0 md:w-1/2 md:px-10">
                    <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group overflow-hidden">
                      <div className="p-5 flex justify-between items-start gap-4">
                          <div className="space-y-1">
                             <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-2xl font-black text-primary tracking-tighter leading-none">{item.time}</span>
                                <h3 className="font-bold text-slate-900 text-base leading-none">{item.title}</h3>
                             </div>
                             {item.description && <p className="text-xs text-slate-500 font-medium pt-1">{item.description}</p>}
                          </div>
                          <Button 
                            variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} 
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all h-8 w-8 -mr-2 -mt-2"
                          >
                             <Trash2 size={16} />
                          </Button>
                      </div>
                    </Card>
                </div>
                <div className="hidden md:block md:w-1/2" />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {(!clientEvent.timeline || clientEvent.timeline.length === 0) && (
          <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl relative z-10 mx-4">
            <Info className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin actividades</p>
          </div>
        )}
      </div>
    </div>
  );
}