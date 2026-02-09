"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Navigation, Save, 
  Loader2, Globe, ExternalLink, Info 
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService } from "@/services/eventService";
import { useAuthStore } from "@/store/useAuthStore";

export function ClientLocationPage() {
  const navigate = useNavigate();
  const { clientEvent, updateCurrentEvent } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  if (!clientEvent) {
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
      updateCurrentEvent(dataToUpdate);
      toast.success("Ubicación actualizada con éxito");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    updateCurrentEvent({ [field]: value });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-black text-foreground">Ubicación</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">¿Dónde será el evento?</p>
          </div>
        </div>

        <Card className="bg-white border-border shadow-xl">
          <CardContent className="p-8 space-y-8">
            
            {/* Información General */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-tighter font-bold">Nombre del Lugar</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ej: Hacienda Los Arcángeles" 
                    value={clientEvent.locationName || ""} 
                    onChange={e => updateField('locationName', e.target.value)}
                    className="bg-secondary/30 border-input pl-10 h-12 text-foreground focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-tighter font-bold">Dirección Física</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea 
                    placeholder="Calle, Número, Colonia, Ciudad, Estado..." 
                    value={clientEvent.address || ""} 
                    onChange={e => updateField('address', e.target.value)}
                    className="w-full bg-secondary/30 border border-input rounded-md pl-10 p-3 h-24 text-sm text-foreground focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Enlaces de Navegación */}
            <div className="pt-6 border-t border-border space-y-6">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Navigation className="w-4 h-4" />
                <h3 className="text-sm font-black uppercase tracking-wider">Enlaces de Navegación</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs flex justify-between font-bold">
                    Link de Google Maps
                    {clientEvent.googleMapsUrl && (
                      <a href={clientEvent.googleMapsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Probar link <ExternalLink size={10} />
                      </a>
                    )}
                  </Label>
                  <Input 
                    placeholder="https://goo.gl/maps/..." 
                    value={clientEvent.googleMapsUrl || ""} 
                    onChange={e => updateField('googleMapsUrl', e.target.value)}
                    className="bg-secondary/30 border-input text-xs font-mono py-6 text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs flex justify-between font-bold">
                    Link de Waze (Opcional)
                    {clientEvent.wazeUrl && (
                      <a href={clientEvent.wazeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        Probar link <ExternalLink size={10} />
                      </a>
                    )}
                  </Label>
                  <Input 
                    placeholder="https://waze.com/ul/..." 
                    value={clientEvent.wazeUrl || ""} 
                    onChange={e => updateField('wazeUrl', e.target.value)}
                    className="bg-secondary/30 border-input text-xs font-mono py-6 text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Tip: Copia el enlace desde la opción "Compartir" de la app de mapas para asegurar que funcione correctamente en todos los dispositivos.
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving || !clientEvent.locationName} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-bold text-lg shadow-lg shadow-primary/20 rounded-xl"
            >
              {isSaving ? <><Loader2 className="animate-spin mr-2" /> Guardando...</> : <><Save className="mr-2 w-5 h-5" /> Guardar Cambios</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}