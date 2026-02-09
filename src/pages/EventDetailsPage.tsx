import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Power, RefreshCw, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventService } from "@/services/eventService";
import { useEventStore } from "@/store/useEventStore";
import { toast } from "sonner"; // Usamos sonner para feedback visual

export function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
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
  }, [eventId]);

  const toggleStatus = async () => {
    if (!currentEvent || !eventId) return;
    const newStatus = currentEvent.status === 'active' ? 'disabled' : 'active';
    
    if (confirm(`¿Cambiar estado a: ${newStatus.toUpperCase()}?`)) {
        try {
            await eventService.update(eventId, { status: newStatus });
            updateCurrentEvent({ status: newStatus });
            toast.success(`Evento ${newStatus === 'active' ? 'activado' : 'deshabilitado'}`);
        } catch (error) {
            toast.error("Error al actualizar estado");
        }
    }
  };

  const regenerateToken = async () => {
    if (!eventId || !currentEvent) return;
    
    if (confirm("⚠️ El link anterior dejará de funcionar. ¿Regenerar?")) {
        try {
            const newToken = crypto.randomUUID();
            await eventService.update(eventId, { adminToken: newToken });
            updateCurrentEvent({ adminToken: newToken });
            toast.success("Token regenerado");
        } catch (error) {
            toast.error("Error al regenerar token");
        }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (isLoading) return <div className="p-20 text-center text-muted-foreground animate-pulse">Cargando detalles...</div>;
  if (!currentEvent) return <div className="p-20 text-center text-destructive font-bold">Evento no encontrado</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/events')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl font-bold text-foreground">{currentEvent.name}</h1>
             {/* Badge corregido: variants nativos */}
             <Badge variant={currentEvent.status === 'active' ? 'default' : 'destructive'}>
                {currentEvent.status === 'active' ? 'Activo' : 'Inactivo'}
             </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Cliente: {currentEvent.client} • ID: {currentEvent.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PANEL 1: SEGURIDAD (Estilo Azul) */}
        <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                    <ShieldCheck className="w-5 h-5" />
                    Credenciales de Acceso
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-blue-900">Token de Seguridad (Admin)</Label>
                    <div className="flex gap-2">
                        <Input 
                            readOnly 
                            value={currentEvent.adminToken || "No generado"} 
                            className="font-mono text-xs bg-white border-blue-200 text-blue-800"
                        />
                        <Button variant="outline" size="icon" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => copyToClipboard(currentEvent.adminToken || "")}>
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-blue-600/80">
                        Este token es único. Si el cliente lo comparte, puedes regenerarlo.
                    </p>
                </div>

                <div className="pt-2">
                    <Button 
                        variant="outline" 
                        className="w-full border-dashed border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                        onClick={regenerateToken}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerar Token
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* PANEL 2: ESTADO (Estilo Neutro) */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Power className="w-5 h-5" />
                    Control de Acceso
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Controla la visibilidad pública. Si lo desactivas, nadie podrá ver la invitación.
                </p>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-slate-50">
                    <div className="space-y-1">
                        <span className="font-medium text-foreground flex items-center gap-2">
                           {currentEvent.status === 'active' ? <CheckCircle2 size={16} className="text-green-600"/> : <AlertCircle size={16} className="text-red-500"/>}
                           Acceso al Sistema
                        </span>
                        <p className="text-xs text-muted-foreground">
                            {currentEvent.status === 'active' ? 'Evento visible y operativo.' : 'Acceso bloqueado temporalmente.'}
                        </p>
                    </div>
                    {/* Botón corregido: variant="default" (primary) o "destructive" */}
                    <Button 
                        variant={currentEvent.status === 'active' ? "destructive" : "default"}
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