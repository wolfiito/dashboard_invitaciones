import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Trash2, Users, ArrowRight, XCircle, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tableService, TableData } from "@/services/tableService";
import { guestService, GuestData } from "@/services/guestService";

export function ClientTablesPage() {
  const navigate = useNavigate();
  const eventId = localStorage.getItem("clientEventId");
  
  const [tables, setTables] = useState<TableData[]>([]);
  const [guests, setGuests] = useState<GuestData[]>([]);
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "Mesa 1", capacity: "10" });

  useEffect(() => {
    if (!eventId) {
      navigate("/login");
      return;
    }
    const unsubTables = tableService.subscribeByEvent(eventId, (data) => setTables(data));
    const unsubGuests = guestService.subscribeByEvent(eventId, (data) => setGuests(data));

    return () => {
      unsubTables();
      unsubGuests();
    };
  }, [eventId, navigate]);

  // --- LÓGICA DE CÁLCULO (NIVEL MIEMBRO) ---
  const getOccupancy = (tableId: string) => {
    let count = 0;
    guests.forEach(group => {
        if(group.members) {
            group.members.forEach(member => {
                if (member.tableId === tableId) count++;
            });
        }
    });
    return count;
  };

  const getTotalUnassigned = () => {
    let count = 0;
    guests.forEach(group => {
        if(group.members) {
            group.members.forEach(member => {
                if (!member.tableId) count++;
            });
        }
    });
    return count;
  };

  // --- ACCIONES DE MESA ---
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setLoading(true);
    try {
      await tableService.add({
        eventId,
        name: formData.name,
        capacity: parseInt(formData.capacity)
      });
      setIsCreateModalOpen(false);
      const nextNum = parseInt(formData.name.replace(/\D/g, '')) + 1;
      setFormData({ 
        name: isNaN(nextNum) ? "" : `Mesa ${nextNum}`, 
        capacity: formData.capacity 
      });
    } catch (error) {
      console.log(error)
      alert("Error creando mesa");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("¿Borrar mesa? Los invitados asignados quedarán sin lugar.")) {
      await tableService.delete(id);
    }
  };

  // --- ACCIÓN DE ASIGNAR MIEMBRO INDIVIDUAL ---
  const handleAssignMember = async (guestId: string, memberName: string, tableId: string | null) => {
    try {
      await guestService.assignMember(guestId, memberName, tableId);
    } catch (error) {
      console.error(error);
    }
  };

  // --- PREPARAR DATOS PARA EL MODAL ---
  // Aplanamos la estructura: De Grupos -> Lista de Personas
  
  // Personas en la mesa seleccionada
  const membersInTable = selectedTable 
    ? guests.flatMap(group => 
        group.members
            .filter(m => m.tableId === selectedTable.id)
            .map(m => ({ ...m, guestId: group.id, familyName: group.familyName }))
      )
    : [];
  
  // Personas sin mesa
  const membersUnassigned = guests.flatMap(group => 
    group.members
        .filter(m => !m.tableId)
        .map(m => ({ ...m, guestId: group.id, familyName: group.familyName }))
  );
  
  const currentOccupancy = selectedTable ? getOccupancy(selectedTable.id!) : 0;
  const isOverCapacity = selectedTable && currentOccupancy > selectedTable.capacity;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Organización de Mesas</h1>
                <p className="text-sm text-slate-400">
                    {getTotalUnassigned()} personas sin asignar
                </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 text-white hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Mesa
          </Button>
        </div>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay mesas creadas.</p>
            </div>
          ) : (
            tables.map(table => {
              const occupied = getOccupancy(table.id!);
              const isFull = occupied >= table.capacity;

              return (
                <Card 
                    key={table.id} 
                    onClick={() => setSelectedTable(table)}
                    className={`bg-slate-900 border-slate-800 relative group cursor-pointer transition-all hover:ring-2 hover:ring-purple-500/50 ${isFull ? 'bg-slate-900/50' : ''}`}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button variant="ghost" size="sm" onClick={(e) => handleDeleteTable(e, table.id!)} className="h-6 w-6 p-0 text-slate-500 hover:text-red-400 hover:bg-slate-800">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-center text-lg truncate px-2">{table.name}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="text-center pb-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className={`text-2xl font-bold ${occupied > table.capacity ? 'text-red-500' : isFull ? 'text-yellow-500' : 'text-slate-200'}`}>
                            {occupied}
                            <span className="text-sm text-slate-500 font-normal">/{table.capacity}</span>
                        </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${occupied > table.capacity ? 'bg-red-500' : isFull ? 'bg-yellow-500' : 'bg-purple-500'} transition-all duration-500`}
                            style={{ width: `${Math.min((occupied / table.capacity) * 100, 100)}%` }}
                        />
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-3">Click para gestionar</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: CREAR MESA */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Agregar Mesa" className="bg-slate-900 border-slate-700 text-white">
        <form onSubmit={handleCreateTable} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Nombre</Label>
            <Input required placeholder="Ej. Mesa 1" className="bg-slate-950 border-slate-700 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Capacidad</Label>
            <Input type="number" min="1" required className="bg-slate-950 border-slate-700 text-white" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 text-white hover:bg-purple-700">Crear</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ASIGNAR PERSONAS INDIVIDUALES */}
      {selectedTable && (
          <Modal 
            isOpen={!!selectedTable} 
            onClose={() => setSelectedTable(null)} 
            title={`Gestionar ${selectedTable.name}`} 
            className="bg-slate-900 border-slate-700 text-white max-w-4xl"
          >
            <div className="space-y-4">
                
                {/* Barra de estado */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${isOverCapacity ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-3">
                        <Users className={isOverCapacity ? "text-red-400" : "text-purple-400"} />
                        <div>
                            <p className="font-medium text-sm">Ocupación Actual</p>
                            <p className="text-xs text-slate-400">{currentOccupancy} de {selectedTable.capacity} lugares</p>
                        </div>
                    </div>
                    {isOverCapacity && (
                        <div className="flex items-center text-red-400 text-xs font-bold gap-1">
                            <AlertCircle className="w-4 h-4" />
                            SOBRECUPO
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
                    
                    {/* IZQUIERDA: GENTE EN LA MESA */}
                    <div className="flex flex-col border border-slate-700 rounded-lg bg-slate-950/50 overflow-hidden">
                        <div className="p-3 bg-slate-900 border-b border-slate-700 font-medium text-sm flex justify-between sticky top-0">
                            <span>En la Mesa</span>
                            <span className="text-purple-400">{membersInTable.length} pax</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {membersInTable.length === 0 ? (
                                <p className="text-center text-slate-600 text-sm py-10">Mesa vacía</p>
                            ) : (
                                membersInTable.map((member, idx) => (
                                    <div key={`${member.guestId}-${idx}`} className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700 hover:border-red-500/50 group transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-purple-400" />
                                                <p className="text-sm font-medium">{member.name}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 ml-5">{member.familyName}</p>
                                        </div>
                                        <Button 
                                            size="sm" variant="ghost" 
                                            onClick={() => handleAssignMember(member.guestId!, member.name, null)} 
                                            className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* DERECHA: GENTE LIBRE */}
                    <div className="flex flex-col border border-slate-700 rounded-lg bg-slate-950/50 overflow-hidden">
                        <div className="p-3 bg-slate-900 border-b border-slate-700 font-medium text-sm flex justify-between sticky top-0">
                            <span>Disponibles</span>
                            <span className="text-slate-400">{membersUnassigned.length} pax</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                             {membersUnassigned.length === 0 ? (
                                <p className="text-center text-slate-600 text-sm py-10">¡Todos tienen lugar!</p>
                            ) : (
                                membersUnassigned.map((member, idx) => (
                                    <div key={`${member.guestId}-${idx}`} className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700 hover:border-green-500/50 group transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium">{member.name}</p>
                                            </div>
                                            <p className="text-xs text-slate-500">{member.familyName}</p>
                                        </div>
                                        <Button 
                                            size="sm" variant="ghost" 
                                            onClick={() => handleAssignMember(member.guestId!, member.name, selectedTable.id!)} 
                                            className="h-8 w-8 p-0 text-slate-500 hover:text-green-400 hover:bg-green-500/10"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={() => setSelectedTable(null)}>Cerrar</Button>
                </div>
            </div>
          </Modal>
      )}
    </div>
  );
}