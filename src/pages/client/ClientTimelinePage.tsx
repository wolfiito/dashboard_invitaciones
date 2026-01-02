"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Clock, ChevronDown,
  Church, Music, Utensils, GlassWater, Cake, Camera, 
  Heart, Bus, Coffee, Star, Sparkles, Info, Loader2
} from "lucide-react";

// UI Components (Ajusta las rutas según tu proyecto)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService, EventData, TimelineItem } from "@/services/eventService";

// Configuración de iconos disponibles
const AVAILABLE_ICONS = [
  { name: "Church", Icon: Church, label: "Ceremonia" },
  { name: "GlassWater", Icon: GlassWater, label: "Cóctel / Bienvenida" },
  { name: "Utensils", Icon: Utensils, label: "Banquete / Cena" },
  { name: "Music", Icon: Music, label: "Fiesta / DJ" },
  { name: "Camera", Icon: Camera, label: "Sesión de Fotos" },
  { name: "Cake", Icon: Cake, label: "Pastel" },
  { name: "Bus", Icon: Bus, label: "Transporte" },
  { name: "Heart", Icon: Heart, label: "Votos / Civil" },
  { name: "Coffee", Icon: Coffee, label: "Torna Boda" },
  { name: "Sparkles", Icon: Sparkles, label: "Salida de Novios" },
  { name: "Star", Icon: Star, label: "Otro" },
];

export function ClientTimelinePage() {
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isIconMenuOpen, setIsIconMenuOpen] = useState(false);

  const eventId = localStorage.getItem("clientEventId");

  // Estado para el nuevo item del itinerario
  const [newItem, setNewItem] = useState<Omit<TimelineItem, 'id'>>({
    time: "",
    title: "",
    description: "",
    icon: "Church"
  });

  useEffect(() => {
    if (!eventId) {
      navigate("/login");
      return;
    }
    const fetchEvent = async () => {
      const data = await eventService.getById(eventId);
      if (data) setEvent(data);
      setLoading(false);
    };
    fetchEvent();
  }, [eventId, navigate]);

  const handleAddItem = async () => {
    if (!event || !newItem.time || !newItem.title) return;
    
    setIsSaving(true);
    try {
      const updatedTimeline = [
        ...(event.timeline || []),
        { ...newItem, id: crypto.randomUUID() }
      ].sort((a, b) => a.time.localeCompare(b.time)); // Ordenar por hora

      await eventService.update(event.id!, { timeline: updatedTimeline });
      setEvent({ ...event, timeline: updatedTimeline });
      
      // Resetear formulario
      setNewItem({ time: "", title: "", description: "", icon: "Church" });
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!event || !event.timeline) return;
    
    const updatedTimeline = event.timeline.filter(item => item.id !== itemId);
    await eventService.update(event.id!, { timeline: updatedTimeline });
    setEvent({ ...event, timeline: updatedTimeline });
  };

  const SelectedIconComponent = AVAILABLE_ICONS.find(i => i.name === newItem.icon)?.Icon || Star;

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <Loader2 className="animate-spin mr-2" /> Cargando itinerario...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 pb-20">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Itinerario
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Cronología del evento</p>
          </div>
        </div>

        {/* Card de Nuevo Item */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-visible">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Hora</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    type="time" 
                    value={newItem.time} 
                    onChange={e => setNewItem({...newItem, time: e.target.value})} 
                    className="bg-slate-950 border-slate-700 pl-10 focus:ring-primary h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Actividad</Label>
                <Input 
                  placeholder="Ej: Ceremonia Religiosa" 
                  value={newItem.title} 
                  onChange={e => setNewItem({...newItem, title: e.target.value})} 
                  className="bg-slate-950 border-slate-700 h-12"
                />
              </div>
            </div>

            {/* Selector de Icono con Dropdown */}
            <div className="space-y-2 relative">
              <Label className="text-slate-400 text-xs uppercase">Icono Visual</Label>
              <button
                type="button"
                onClick={() => setIsIconMenuOpen(!isIconMenuOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 hover:border-blue-500 transition-all h-12"
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-400">
                    <SelectedIconComponent size={20} />
                  </div>
                  <span className="text-sm">
                    {AVAILABLE_ICONS.find(i => i.name === newItem.icon)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isIconMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isIconMenuOpen && (
                <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-60 overflow-y-auto">
                  {AVAILABLE_ICONS.map(({ name, Icon, label }) => (
                    <button
                      key={name}
                      onClick={() => {
                        setNewItem({ ...newItem, icon: name });
                        setIsIconMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${
                        newItem.icon === name 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase">Descripción (opcional)</Label>
              <Input 
                placeholder="Ej: Templo de San Francisco" 
                value={newItem.description} 
                onChange={e => setNewItem({...newItem, description: e.target.value})} 
                className="bg-slate-950 border-slate-700 h-12"
              />
            </div>

            <Button 
              onClick={handleAddItem} 
              disabled={isSaving || !newItem.time || !newItem.title}
              className="w-full bg-blue-600 hover:bg-blue-500 font-bold h-12"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Agregar actividad
            </Button>
          </CardContent>
        </Card>

        {/* Lista del Timeline */}
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-800 before:z-0">
          {event?.timeline?.map((item) => {
            const IconComponent = AVAILABLE_ICONS.find(i => i.name === item.icon)?.Icon || Star;
            return (
              <div key={item.id} className="relative z-10 flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-blue-400 border border-slate-800 shadow-inner">
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-mono font-bold tracking-tighter">{item.time}</span>
                      <span className="font-semibold text-slate-100">{item.title}</span>
                    </div>
                    <div className="text-sm text-slate-500">{item.description}</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDeleteItem(item.id)} 
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}

          {(!event?.timeline || event.timeline.length === 0) && (
            <div className="text-center py-20 text-slate-600 border-2 border-dashed border-slate-900 rounded-3xl relative z-10 bg-slate-950/50">
              <Info className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No has definido actividades para el itinerario.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}