import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Power, RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventService, EventData } from "@/services/eventService";

export function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Función para cargar datos
  const fetchEvent = async () => {
    if (!eventId) return;
    try {
      const data = await eventService.getById(eventId);
      setEvent(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // Lógica: Activar / Desactivar
  const toggleStatus = async () => {
    if (!event || !eventId) return;
    const newStatus = event.status === 'active' ? 'disabled' : 'active';
    
    if (confirm(`¿Estás seguro de cambiar el estado a: ${newStatus.toUpperCase()}?`)) {
        setIsUpdating(true);
        await eventService.update(eventId, { status: newStatus });
        setEvent({ ...event, status: newStatus }); // Optimistic update
        setIsUpdating(false);
    }
  };

  // Lógica: Regenerar Token de Seguridad
  const regenerateToken = async () => {
    if (!eventId) return;
    
    if (confirm("⚠️ ATENCIÓN: Al regenerar el token, el link anterior dejará de funcionar y el cliente perderá acceso hasta que le envíes el nuevo. ¿Continuar?")) {
        setIsUpdating(true);
        const newToken = crypto.randomUUID(); // Genera un UUID v4 seguro
        await eventService.update(eventId, { adminToken: newToken });
        setEvent((prev) => prev ? { ...prev, adminToken: newToken } : null);
        setIsUpdating(false);
        alert("Nuevo token generado de forma segura.");
    }
  };

  // Lógica: Copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  if (loading) return <div className="p-8 text-center text-secondary">Cargando...</div>;
  if (!event) return <div className="p-8 text-center text-red-400">Evento no encontrado</div>;

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
            {event.name}
            <Badge variant={event.status === 'active' ? 'success' : event.status === 'disabled' ? 'destructive' : 'default'}>
              {event.status === 'active' ? 'Activo' : event.status === 'disabled' ? 'Deshabilitado' : event.status}
            </Badge>
          </h1>
          <p className="text-secondary text-sm">Cliente: {event.client} • ID: {event.id}</p>
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
                            value={event.adminToken || "No generado"} 
                            className="font-mono text-xs bg-slate-900 border-blue-500/30 text-blue-200"
                        />
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(event.adminToken || "")}>
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
                        disabled={isUpdating}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? "animate-spin" : ""}`} />
                        Regenerar Token de Acceso
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* PANEL 2: CONFIGURACIÓN GLOBAL (Zona de Peligro) */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Power className="w-5 h-5" />
                    Estado del Evento
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-secondary">
                    Controla la visibilidad del evento. Si lo desactivas, el cliente y sus invitados no podrán acceder a la plataforma.
                </p>
                
                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg bg-surface">
                    <div className="space-y-1">
                        <span className="font-medium text-text">Acceso al Sistema</span>
                        <p className="text-xs text-secondary">
                            {event.status === 'active' ? 'El evento está visible y operativo.' : 'El acceso está bloqueado.'}
                        </p>
                    </div>
                    <Button 
                        variant={event.status === 'active' ? "destructive" : "primary"} // Rojo si es para apagar, Azul para encender
                        onClick={toggleStatus}
                        disabled={isUpdating}
                    >
                        {event.status === 'active' ? 'Desactivar' : 'Activar'}
                    </Button>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}