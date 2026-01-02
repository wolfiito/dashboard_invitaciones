import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Calendar, Users, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventService, EventData } from "@/services/eventService";
import { guestService } from "@/services/guestService";
import { QrCode } from "lucide-react";

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS PARA CONTADORES
  const [totalGuests, setTotalGuests] = useState(0);
  const [confirmedGuests, setConfirmedGuests] = useState(0);

  useEffect(() => {
    const eventId = localStorage.getItem("clientEventId");
    
    if (!eventId) {
      navigate("/login");
      return;
    }

    // 1. Cargar datos del Evento
    const fetchEvent = async () => {
      try {
        const data = await eventService.getById(eventId);
        if (data) setEvent(data);
        else navigate("/login");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();

    // 2. Suscribirse a los Invitados
    const unsubscribeGuests = guestService.subscribeByEvent(eventId, (guests) => {
      
      // SUMAR PERSONAS TOTALES (Esto está bien)
      const totalCount = guests.reduce((sum, guest) => {
        const count = guest.members ? guest.members.length : 0;
        return sum + count;
      }, 0);
      setTotalGuests(totalCount);

      // --- CORRECCIÓN AQUÍ ---
      // SUMAR PERSONAS CONFIRMADAS REALES
      const confirmedCount = guests.reduce((sum, guest) => {
        if (!guest.members) return sum;
        
        // Antes sumábamos todo el grupo. Ahora filtramos uno por uno.
        const membersGoing = guest.members.filter(m => m.isConfirmed).length;
        
        return sum + membersGoing;
      }, 0);
      setConfirmedGuests(confirmedCount);
    });

    return () => unsubscribeGuests();
  }, [navigate]);

  const handleLogout = () => {
    if(confirm("¿Cerrar sesión del evento?")) {
      localStorage.removeItem("clientEventId");
      navigate("/login");
    }
  };

  const getDaysRemaining = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;
  if (!event) return null;

  const daysLeft = getDaysRemaining(event.date);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">
            Mi<span className="text-primary">Evento</span>
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 space-y-8 py-8">
        
        {/* HERO */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Calendar className="w-4 h-4" />
            {new Date(event.date).toLocaleDateString('es-ES', { dateStyle: 'long', timeZone: 'UTC' })}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {event.name}
          </h1>
        </div>

        {/* GRID DE ESTADÍSTICAS REALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Cuenta Regresiva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{daysLeft}</span>
                <span className="text-sm text-slate-500">días</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Personas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-white">{totalGuests}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Lugares asignados</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Confirmados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-white">{confirmedGuests}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Lugares confirmados</p>
            </CardContent>
          </Card>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div 
                onClick={() => navigate('/client/guests')} 
                className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group"
            >
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Gestionar Invitados</h3>
                <p className="text-slate-400 text-sm mt-1">Agrega familiares, envía invitaciones por WhatsApp y ve quién confirmó.</p>
            </div>

            <div 
                onClick={() => navigate('/client/tables')}
                className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group"
            >
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Organizar Mesas</h3>
                <p className="text-slate-400 text-sm mt-1">Arrastra y suelta a tus invitados en las mesas del plano.</p>
            </div>

            <div 
                onClick={() => navigate('/client/hostess')}
                className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group"
            >
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                    <QrCode className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Modo Hostess</h3>
                <p className="text-slate-400 text-sm mt-1">Escanear entradas en la puerta y asignar mesas.</p>
            </div>

            <div>
              <Card 
                className="cursor-pointer hover:bg-slate-900 transition-all border-slate-800"
                onClick={() => navigate("/client/timeline")} // Asegúrate de que esta ruta coincida con App.tsx
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg">Itinerario</h3>
                    <p className="text-sm text-slate-500">Gestiona los horarios del evento</p>
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>

        <div 
                onClick={() => navigate('/client/location')}
                className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group"
            >
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                    <QrCode className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Configurar Ubicación</h3>
                <p className="text-slate-400 text-sm mt-1">Evento Principal</p>
            </div>

            <div 
                onClick={() => navigate('/client/gift')}
                className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group"
            >
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                    <QrCode className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Configurar Ubicación</h3>
                <p className="text-slate-400 text-sm mt-1">Evento Principal</p>
            </div>

      </main>
    </div>
  );
}