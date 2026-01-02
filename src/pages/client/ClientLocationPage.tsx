"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Navigation, Save, 
  Loader2, Globe, ExternalLink, Info 
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService, EventData } from "@/services/eventService";

export function ClientLocationPage() {
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Obtenemos el ID del evento del cliente logueado
  const eventId = localStorage.getItem("clientEventId");

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

  const handleSave = async () => {
    if (!event?.id) return;

    setIsSaving(true);
    try {
      // PRÁCTICA SENIOR: Sanitización de datos
      // Evitamos 'undefined' enviando strings vacíos si el campo está vacío
      const dataToUpdate = {
        locationName: event.locationName || "",
        address: event.address || "",
        googleMapsUrl: event.googleMapsUrl || "",
        wazeUrl: event.wazeUrl || "",
      };

      await eventService.update(event.id, dataToUpdate);
      alert("📍 ¡Ubicación actualizada con éxito!");
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2" /> Cargando ubicación...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header con navegación de vuelta */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-white">Ubicación</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">¿Dónde será el evento?</p>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardContent className="p-8 space-y-8">
            
            {/* Sección de Información General */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-tighter">Nombre del Lugar</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="Ej: Hacienda Los Arcángeles" 
                    value={event?.locationName || ""} 
                    onChange={e => setEvent(prev => prev ? {...prev, locationName: e.target.value} : null)}
                    className="bg-slate-950 border-slate-700 pl-10 h-12 text-white focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-tighter">Dirección Física</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea 
                    placeholder="Calle, Número, Colonia, Ciudad, Estado..." 
                    value={event?.address || ""} 
                    onChange={e => setEvent(prev => prev ? {...prev, address: e.target.value} : null)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md pl-10 p-3 h-24 text-sm text-white focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sección de Enlaces de Navegación */}
            <div className="pt-6 border-t border-slate-800 space-y-6">
              <div className="flex items-center gap-2 text-blue-400 mb-4">
                <Navigation className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Enlaces de Navegación</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs flex justify-between">
                    Link de Google Maps
                    {event?.googleMapsUrl && (
                      <a href={event.googleMapsUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        Probar link <ExternalLink size={10} />
                      </a>
                    )}
                  </Label>
                  <Input 
                    placeholder="https://goo.gl/maps/..." 
                    value={event?.googleMapsUrl || ""} 
                    onChange={e => setEvent(prev => prev ? {...prev, googleMapsUrl: e.target.value} : null)}
                    className="bg-slate-950 border-slate-700 text-xs font-mono py-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs flex justify-between">
                    Link de Waze (Opcional)
                    {event?.wazeUrl && (
                      <a href={event.wazeUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        Probar link <ExternalLink size={10} />
                      </a>
                    )}
                  </Label>
                  <Input 
                    placeholder="https://waze.com/ul/..." 
                    value={event?.wazeUrl || ""} 
                    onChange={e => setEvent(prev => prev ? {...prev, wazeUrl: e.target.value} : null)}
                    className="bg-slate-950 border-slate-700 text-xs font-mono py-6"
                  />
                </div>
              </div>
            </div>

            {/* Aviso Informativo */}
            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Asegúrate de copiar el enlace completo desde la opción "Compartir" en Google Maps o Waze para que los invitados puedan abrir la ruta directamente en sus celulares.
              </p>
            </div>

            {/* Botón Guardar */}
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !event?.locationName} 
              className="w-full bg-blue-600 hover:bg-blue-500 h-14 font-bold text-lg shadow-lg shadow-blue-900/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 w-5 h-5" /> Guardar Cambios
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}