// src/pages/EventDetailsPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Power, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventService } from "@/services/eventService";
import { useEventStore } from "@/store/useEventStore";

export function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // Usamos el Store Global en lugar de estados locales
  const { 
    currentEvent, 
    setCurrentEvent, 
    isLoading, 
    setLoading, 
    updateCurrentEvent 
  } = useEventStore();

  const fetchEvent = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await eventService.getById(eventId);
      setCurrentEvent(data);
    } catch (error) {
      console.error("Error al cargar evento:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    // Limpieza al desmontar: opcionalmente puedes resetear el evento actual
    // return () => setCurrentEvent(null);
  }, [eventId]);

  const toggleStatus = async () => {
    if (!currentEvent || !eventId) return;
    const newStatus = currentEvent.status === 'active' ? 'disabled' : 'active';
    
    if (confirm(`¿Estás seguro de cambiar el estado a: ${newStatus.toUpperCase()}?`)) {
        try {
            await eventService.update(eventId, { status: newStatus });
            updateCurrentEvent({ status: newStatus }); // Actualización global inmediata
        } catch (error) {
            alert("Error al actualizar el estado");
        }
    }
  };

  const regenerateToken = async () => {
    if (!eventId || !currentEvent) return;
    
    if (confirm("⚠️ ATENCIÓN: Al regenerar el token, el link anterior dejará de funcionar. ¿Continuar?")) {
        try {
            const newToken = crypto.randomUUID();
            await eventService.update(eventId, { adminToken: newToken });
            updateCurrentEvent({ adminToken: newToken });
            alert("Nuevo token generado de forma segura.");
        } catch (error) {
            alert("Error al regenerar token");
        }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  if (isLoading) return <div className="p-8 text-center text-secondary">Cargando...</div>;
  if (!currentEvent) return <div className="p-8 text-center text-red-400">Evento no encontrado</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            {currentEvent.name}
            <Badge variant={currentEvent.status === 'active' ? 'success' : currentEvent.status === 'disabled' ? 'destructive' : 'default'}>
              {currentEvent.status === 'active' ? 'Activo' : currentEvent.status === 'disabled' ? 'Deshabilitado' : currentEvent.status}
            </Badge>
          </h1>
          <p className="text-secondary text-sm">Cliente: {currentEvent.client} • ID: {currentEvent.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PANEL 1: SEGURIDAD Y ACCESOS */}
        <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                    Credenciales de Acceso
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Token de Seguridad (Admin)</Label>
                    <div className="flex gap-2">
                        <Input 
                            readOnly 
                            value={currentEvent.adminToken || "No generado"} 
                            className="font-mono text-xs bg-slate-900 border-blue-500/30 text-blue-200"
                        />
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(currentEvent.adminToken || "")}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-secondary">
                        Este token es único. Si el cliente lo comparte, puedes regenerarlo aquí.
                    </p>
                </div>

                <div className="pt-2">
                    <Button 
                        variant="outline" 
                        className="w-full border-dashed border-slate-600 hover:border-blue-400 hover:text-blue-400"
                        onClick={regenerateToken}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerar Token de Acceso
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* PANEL 2: CONFIGURACIÓN GLOBAL */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Power className="w-5 h-5" />
                    Estado del Evento
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-secondary">
                    Controla la visibilidad del evento. Si lo desactivas, el cliente y sus invitados no podrán acceder.
                </p>
                
                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg bg-surface">
                    <div className="space-y-1">
                        <span className="font-medium text-text">Acceso al Sistema</span>
                        <p className="text-xs text-secondary">
                            {currentEvent.status === 'active' ? 'El evento está visible y operativo.' : 'El acceso está bloqueado.'}
                        </p>
                    </div>
                    <Button 
                        variant={currentEvent.status === 'active' ? "destructive" : "primary"}
                        onClick={toggleStatus}
                    >
                        {currentEvent.status === 'active' ? 'Desactivar' : 'Activar'}
                    </Button>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}