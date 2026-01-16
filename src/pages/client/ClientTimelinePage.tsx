// src/pages/client/ClientTimelinePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Clock, ChevronDown, Star, Info, Loader2,
  CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Componentes del Proyecto
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService, TimelineItem } from "@/services/eventService";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { IconBrindis, PngIcon, IconAnillos, IconComida, IconFotos} from "@/components/icons/CustomIcons";
import imgRecepcion from "@/assets/reception.png"; 

const IconRecepcion = ({ size, className }: { size?: number | string, className?: string }) => (
  <PngIcon 
    src={imgRecepcion} 
    size={size} 
    className={className} 
  />
);

const AVAILABLE_ICONS = [
  
  { name: "Recepcion", Icon: IconRecepcion, label: "Recepción" },
  { name: "Ceremonia", Icon: IconAnillos, label: "Ceremonia" },
  { name: "Comida", Icon: IconComida, label: "Comida" },
  { name: "Fotos", Icon: IconFotos, label: "Fotos" },
  { name: "Brindis", Icon: IconBrindis, label: "Brindis" },

];

export function ClientTimelinePage() {
  const navigate = useNavigate();
  const { clientEvent, updateCurrentEvent } = useAuthStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isIconMenuOpen, setIsIconMenuOpen] = useState(false);

  // Estado para el nuevo item
  const [newItem, setNewItem] = useState<Omit<TimelineItem, 'id'>>({
    time: "",
    title: "",
    description: "",
    icon: "Church"
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
      updateCurrentEvent({ timeline: updatedTimeline }); // Actualización global inmediata
      
      toast.success("Actividad agregada");
      setNewItem({ time: "", title: "", description: "", icon: "Church" });
    } catch (error) {
      toast.error("Error al guardar itinerario" + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!clientEvent?.timeline) return;
    
    const updatedTimeline = clientEvent.timeline.filter(item => item.id !== itemId);
    try {
        await eventService.update(clientEvent.id!, { timeline: updatedTimeline });
        updateCurrentEvent({ timeline: updatedTimeline });
        toast.success("Actividad eliminada");
    } catch (e) {
        toast.error("No se pudo eliminar" + e);
    }
  };

  const SelectedIconComponent = AVAILABLE_ICONS.find(i => i.name === newItem.icon)?.Icon || Star;

  if (!clientEvent) return null;

  return (
    <div className="space-y-8 pb-24">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-slate-400 p-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-white">Itinerario</h1>
            <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
               <CalendarDays size={14} /> {clientEvent.name}
            </p>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE NUEVA ACTIVIDAD (ESTILO CARD BENTO) */}
      <Card className="bg-slate-900/40 border-slate-800 shadow-2xl overflow-visible">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* HORA */}
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  type="time" 
                  value={newItem.time} 
                  onChange={e => setNewItem({...newItem, time: e.target.value})} 
                  className="bg-slate-950 border-slate-800 pl-10 h-12 text-white font-bold"
                />
              </div>
            </div>

            {/* ACTIVIDAD */}
            <div className="md:col-span-9 space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actividad principal</Label>
              <Input 
                placeholder="Ej: Recepción de Invitados" 
                value={newItem.title} 
                onChange={e => setNewItem({...newItem, title: e.target.value})} 
                className="bg-slate-950 border-slate-800 h-12 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* SELECTOR ICONO */}
            <div className="md:col-span-4 space-y-2 relative">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría</Label>
              <button
                type="button"
                onClick={() => setIsIconMenuOpen(!isIconMenuOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 hover:border-primary transition-all h-12"
              >
                <div className="flex items-center gap-3">
                  <SelectedIconComponent size={20} className="text-primary" />
                  <span className="text-sm font-medium">
                    {AVAILABLE_ICONS.find(i => i.name === newItem.icon)?.label}
                  </span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform", isIconMenuOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isIconMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 grid grid-cols-2 gap-1 max-h-60 overflow-y-auto"
                  >
                    {AVAILABLE_ICONS.map(({ name, Icon, label }) => (
                      <button
                        key={name}
                        onClick={() => {
                          setNewItem({ ...newItem, icon: name });
                          setIsIconMenuOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all",
                          newItem.icon === name 
                          ? "bg-primary text-white" 
                          : "text-slate-400 hover:bg-slate-800"
                        )}
                      >
                        <Icon size={16} /> {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="md:col-span-8 space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lugar / Detalles</Label>
              <Input 
                placeholder="Ej: Jardín del Sol" 
                value={newItem.description} 
                onChange={e => setNewItem({...newItem, description: e.target.value})} 
                className="bg-slate-950 border-slate-800 h-12 text-white"
              />
            </div>
          </div>

          <Button 
            onClick={handleAddItem} 
            disabled={isSaving || !newItem.time || !newItem.title}
            className="w-full h-14 bg-primary hover:bg-primary/90 font-black text-lg rounded-2xl shadow-lg shadow-primary/20"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" />}
            Agregar actividad
          </Button>
        </CardContent>
      </Card>

      {/* LISTADO DEL TIMELINE (ESTILO MODERNO) */}
      <div className="relative space-y-6 before:absolute before:inset-0 before:left-6 md:before:left-1/2 before:w-0.5 before:bg-slate-800 before:z-0">
        <AnimatePresence mode="popLayout">
          {clientEvent.timeline?.map((item, index) => {
            const IconComponent = AVAILABLE_ICONS.find(i => i.name === item.icon)?.Icon || Star;
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                    "relative z-10 flex items-start gap-4 md:gap-0 w-full",
                    index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"
                )}
              >
                {/* PUNTO CENTRAL (ICONO) */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-primary shadow-xl z-20">
                    <IconComponent size={20} />
                </div>

                {/* CONTENIDO CARD */}
                <div className="flex-1 pl-16 md:pl-0 md:w-1/2 md:px-12">
                   <Card className="bg-slate-900/60 backdrop-blur-md border-slate-800 hover:border-slate-700 transition-all group overflow-hidden">
                      <CardContent className="p-4 flex justify-between items-center">
                         <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black text-primary tracking-tighter">{item.time}</span>
                                <h3 className="font-bold text-white text-sm md:text-base">{item.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{item.description}</p>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteItem(item.id)} 
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 hover:bg-red-400/5 transition-all p-2 rounded-xl"
                         >
                            <Trash2 size={16} />
                         </Button>
                      </CardContent>
                   </Card>
                </div>
                
                {/* ESPACIO VACÍO EN DESKTOP */}
                <div className="hidden md:block md:w-1/2" />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {(!clientEvent.timeline || clientEvent.timeline.length === 0) && (
          <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl relative z-10">
            <Info className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Itinerario vacío</p>
            <p className="text-slate-600 text-sm mt-1">Empieza agregando actividades arriba.</p>
          </div>
        )}
      </div>
    </div>
  );
}