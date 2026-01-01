import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // <--- Importante para la navegación
import { Plus, MoreHorizontal, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventService, EventData } from "@/services/eventService";

export function EventsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]); 

  useEffect(() => {
    const unsubscribe = eventService.subscribe((data) => {
      setEvents(data);
    });
    return () => unsubscribe();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    date: ""
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await eventService.create({
        name: formData.name,
        client: formData.client,
        date: formData.date,
        guests: 0,
        status: 'active',
        userId: "admin_temp_123" 
      });
      setIsModalOpen(false);
      setFormData({ name: "", client: "", date: "" });
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar evento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text">Gestión de Eventos</h2>
          <p className="text-secondary mt-1">Administra todos los eventos de tus clientes.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Crear Nuevo Evento
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
          <Input placeholder="Buscar evento..." className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Listado Global</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Evento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-secondary">
                    No hay eventos registrados. ¡Crea el primero!
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        {/* AQUÍ ESTÁ EL CAMBIO CLAVE: El Link */}
                        <Link 
                          to={`/events/${event.id}`} 
                          className="text-primary hover:underline hover:text-blue-400 transition-colors"
                        >
                          {event.name}
                        </Link>
                        <span className="text-xs text-secondary md:hidden">{event.guests} inv.</span>
                      </div>
                    </TableCell>
                    <TableCell>{event.client}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-secondary">
                        <Calendar className="w-3 h-3 mr-2" />
                        {event.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        event.status === 'active' ? 'success' : 
                        event.status === 'pending' ? 'warning' : 'default'
                      }>
                        {event.status === 'active' ? 'Activo' : 
                         event.status === 'pending' ? 'Pendiente' : 'Finalizado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Evento">
        <form className="space-y-4" onSubmit={handleCreateEvent}>
          <div className="space-y-2">
            <Label htmlFor="eventName">Nombre del Evento</Label>
            <Input id="eventName" placeholder="Ej. Boda Maria y Jose" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientName">Nombre del Cliente</Label>
            <Input id="clientName" placeholder="Ej. Maria Lopez" required value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDate">Fecha del Evento</Label>
            <Input id="eventDate" type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar Evento"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}