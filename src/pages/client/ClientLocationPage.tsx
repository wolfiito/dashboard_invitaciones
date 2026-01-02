"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Navigation, Save, 
  Loader2, Globe, ExternalLink, Info 
} from "lucide-react";
import { toast } from "sonner"; // Usamos sonner para feedback

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService } from "@/services/eventService";
import { useAuthStore } from "@/store/useAuthStore"; // <--- IMPORTANTE

export function ClientLocationPage() {
  const navigate = useNavigate();
  
  // USAMOS EL STORE EN LUGAR DE LOCALSTORAGE
  const { clientEvent, updateCurrentEvent } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Si no hay evento cargado en el store, redirigimos (protección extra)
  if (!clientEvent) {
      // Un pequeño efecto para redirigir si se pierde el estado
      setTimeout(() => navigate("/login"), 100);
      return null;
  }

  const handleSave = async () => {
    if (!clientEvent?.id) return;

    setIsSaving(true);
    try {
      const dataToUpdate = {
        locationName: clientEvent.locationName || "",
        address: clientEvent.address || "",
        googleMapsUrl: clientEvent.googleMapsUrl || "",
        wazeUrl: clientEvent.wazeUrl || "",
      };

      await eventService.update(clientEvent.id, dataToUpdate);
      updateCurrentEvent(dataToUpdate); // Actualizamos el store localmente
      toast.success("Ubicación actualizada con éxito");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper para actualizar campos locales (optimistic UI)
  const updateField = (field: string, value: string) => {
    updateCurrentEvent({ [field]: value });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-white">Ubicación</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">¿Dónde será el evento?</p>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardContent className="p-8 space-y-8">
            
            {/* Información General */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-tighter">Nombre del Lugar</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    placeholder="Ej: Hacienda Los Arcángeles" 
                    value={clientEvent.locationName || ""} 
                    onChange={e => updateField('locationName', e.target.value)}
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
                    value={clientEvent.address || ""} 
                    onChange={e => updateField('address', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md pl-10 p-3 h-24 text-sm text-white focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Enlaces de Navegación */}
            <div className="pt-6 border-t border-slate-800 space-y-6">
              <div className="flex items-center gap-2 text-blue-400 mb-4">
                <Navigation className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Enlaces de Navegación</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs flex justify-between">
                    Link de Google Maps
                    {clientEvent.googleMapsUrl && (
                      <a href={clientEvent.googleMapsUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        Probar link <ExternalLink size={10} />
                      </a>
                    )}
                  </Label>
                  <Input 
                    placeholder="https://goo.gl/maps/..." 
                    value={clientEvent.googleMapsUrl || ""} 
                    onChange={e => updateField('googleMapsUrl', e.target.value)}
                    className="bg-slate-950 border-slate-700 text-xs font-mono py-6"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs flex justify-between">
                    Link de Waze (Opcional)
                    {clientEvent.wazeUrl && (
                      <a href={clientEvent.wazeUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        Probar link <ExternalLink size={10} />
                      </a>
                    )}
                  </Label>
                  <Input 
                    placeholder="https://waze.com/ul/..." 
                    value={clientEvent.wazeUrl || ""} 
                    onChange={e => updateField('wazeUrl', e.target.value)}
                    className="bg-slate-950 border-slate-700 text-xs font-mono py-6"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Tip: Copia el enlace desde la opción "Compartir" de la app de mapas.
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving || !clientEvent.locationName} 
              className="w-full bg-blue-600 hover:bg-blue-500 h-14 font-bold text-lg"
            >
              {isSaving ? <><Loader2 className="animate-spin mr-2" /> Guardando...</> : <><Save className="mr-2 w-5 h-5" /> Guardar Cambios</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}