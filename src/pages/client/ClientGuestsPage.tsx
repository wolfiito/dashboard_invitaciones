import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check, MessageCircle, X, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { guestService, GuestData, GuestMember } from "@/services/guestService";
import QRCode from "react-qr-code"; // <--- IMPORTANTE

export function ClientGuestsPage() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const eventId = localStorage.getItem("clientEventId");

  // Estados del Formulario
  const [modalView, setModalView] = useState<'form' | 'success'>('form');
  const [lastSavedGuest, setLastSavedGuest] = useState<GuestData | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [currentMemberName, setCurrentMemberName] = useState("");
  const [membersList, setMembersList] = useState<GuestMember[]>([]);

  // Estado para el Modal de QR (Ticket)
  const [selectedTicketGuest, setSelectedTicketGuest] = useState<GuestData | null>(null);

  useEffect(() => {
    if (!eventId) {
      navigate("/login");
      return;
    }
    const unsubscribe = guestService.subscribeByEvent(eventId, (data) => {
      setGuests(data);
    });
    return () => unsubscribe();
  }, [eventId, navigate]);

  // ... (Funciones de agregar/borrar miembros siguen igual que antes) ...
  const addMemberToList = () => {
    if (!currentMemberName.trim()) return;
    setMembersList([...membersList, { name: currentMemberName, isConfirmed: false, tableId: null }]);
    setCurrentMemberName("");
  };

  const removeMemberFromList = (index: number) => {
    const newList = [...membersList];
    newList.splice(index, 1);
    setMembersList(newList);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    if (membersList.length === 0) {
        alert("Agrega al menos un integrante.");
        return;
    }
    setIsLoading(true);
    const newGuestData: Omit<GuestData, 'id'> = {
        eventId,
        familyName,
        members: membersList,
        status: 'pending'
    };
    try {
      const newId = await guestService.add(newGuestData);
      setLastSavedGuest({ ...newGuestData, id: newId } as GuestData);
      setModalView('success'); 
      setFamilyName("");
      setMembersList([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (guestId: string) => {
    if (confirm("¿Eliminar familia?")) {
      await guestService.delete(guestId);
    }
  };

  // --- UTILS QR Y WHATSAPP ---
  
  // Genera el texto resumen de mesas (Lo que pediste)
  const getTableSummary = (guest: GuestData) => {
    // Agrupamos por mesa (esto es solo texto visual)
    const summary = guest.members.map(m => {
        // Aquí idealmente buscaríamos el nombre real de la mesa con el tableId
        // Pero por ahora mostraremos "Mesa Asignada" o "Sin Asignar"
        // (Para mostrar "Mesa 1" necesitamos cruzar datos con tables, lo haremos en la v2)
        const mesa = m.tableId ? "Mesa Asignada" : "Por asignar"; 
        return `• ${m.name} (${mesa})`;
    }).join('\n');
    return summary;
  };
  const shareInvitation = (guest: GuestData) => {
    // URL DE LA INVITACIÓN (Apunta a tu proyecto Vite de invitación)
  // En producción, aquí pondrás tu dominio real (ej. bodaanayluis.com)
  const invitationBaseUrl = "http://localhost:5174"; 

    // CAMBIO CLAVE: Usamos 'ticket=' con el ID único, NO el nombre
    // Esto hace que el link sea único e impredescible.
    console.log(guest.id)
    const uniqueLink = `${invitationBaseUrl}/?ticket=${guest.id}`;
    
    // El texto del mensaje sí lleva el nombre para que sea cálido
    const message = `Hola ${guest.familyName} 👋,\n\nLes enviamos su invitación digital personalizada.\nHemos reservado ${guest.members.length} lugares para ustedes.\n\nConfirmen aquí: ${uniqueLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareTicket = (guest: GuestData) => {
    // Este mensaje envía el resumen de mesas y el código "secreto" (ID)
    const summary = getTableSummary(guest);
    const message = `Hola ${guest.familyName}, aquí están sus accesos confirmados:\n\n${summary}\n\nPresenten este código al llegar: ${guest.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalView('form'), 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Lista de Invitados</h1>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-white hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Familia
          </Button>
        </div>

        {/* Tabla */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950">
              <TableRow className="border-slate-800 hover:bg-slate-950">
                <TableHead className="text-slate-400">Grupo</TableHead>
                <TableHead className="text-slate-400">Integrantes</TableHead>
                <TableHead className="text-slate-400">Total</TableHead>
                <TableHead className="text-slate-400">Estado</TableHead>
                <TableHead className="text-right text-slate-400">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    Sin registros.
                  </TableCell>
                </TableRow>
              ) : (
                guests.map((guest) => (
                  <TableRow key={guest.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-200">
                      {guest.familyName}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                        <div className="flex flex-wrap gap-1">
                            {guest.members && guest.members.slice(0, 3).map((m, i) => (
                                <span key={i} className="text-xs border border-slate-700 px-1 rounded">{m.name}</span>
                            ))}
                            {guest.members && guest.members.length > 3 && <span className="text-xs text-slate-500">+{guest.members.length - 3}</span>}
                        </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                        {guest.members ? guest.members.length : 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={guest.status === 'confirmed' ? 'success' : guest.status === 'declined' ? 'destructive' : 'warning'}>
                        {guest.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                             {/* BOTÓN QR / TICKET */}
                             <Button 
                                variant="ghost" size="sm" 
                                onClick={() => setSelectedTicketGuest(guest)}
                                className="text-slate-500 hover:text-blue-400"
                                title="Ver Boleto QR"
                             >
                                <QrCode className="w-4 h-4" />
                            </Button>
                            
                            {/* BOTÓN ELIMINAR */}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(guest.id!)} className="text-slate-500 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- MODAL CREAR FAMILIA --- */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalView === 'form' ? "Registrar Familia" : "¡Grupo Creado!"} className="bg-slate-900 border-slate-700 text-white">
        {modalView === 'form' ? (
            <form onSubmit={handleSaveGroup} className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-slate-300">Nombre Familia</Label>
                    <Input required placeholder="Ej. Familia Pérez" className="bg-slate-950 border-slate-700 text-white" value={familyName} onChange={e => setFamilyName(e.target.value)} />
                </div>
                <div className="space-y-3 bg-slate-800/30 p-4 rounded-lg border border-slate-800">
                    <Label className="text-slate-300">Integrantes</Label>
                    <div className="flex gap-2">
                        <Input placeholder="Nombre..." className="bg-slate-950 border-slate-700 text-white" value={currentMemberName} onChange={e => setCurrentMemberName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMemberToList())} />
                        <Button type="button" onClick={addMemberToList} className="bg-slate-800"><Plus className="w-4 h-4" /></Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto mt-2">
                        {membersList.map((m, i) => (
                            <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-800 text-sm">
                                <span>{m.name}</span>
                                <button type="button" onClick={() => removeMemberFromList(i)} className="text-red-400"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pt-2">
                    <Button type="submit" disabled={isLoading} className="w-full bg-primary text-white hover:bg-blue-600">Guardar</Button>
                </div>
            </form>
        ) : (
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8" /></div>
                <h3 className="text-xl font-bold">¡Listo!</h3>
                <Button onClick={() => shareInvitation(lastSavedGuest!)} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                    <MessageCircle className="w-4 h-4 mr-2" /> Enviar Invitación
                </Button>
                <Button variant="ghost" onClick={() => setModalView('form')} className="w-full text-slate-500">Nuevo registro</Button>
            </div>
        )}
      </Modal>

      {/* --- MODAL TICKET QR --- */}
      {selectedTicketGuest && (
        <Modal 
            isOpen={!!selectedTicketGuest} 
            onClose={() => setSelectedTicketGuest(null)} 
            title="Boleto Digital de Acceso" 
            className="bg-white text-slate-900 border-none max-w-sm" // Fondo blanco para que el QR resalte
        >
            <div className="flex flex-col items-center space-y-6 py-4">
                
                {/* Título Ticket */}
                <div className="text-center space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">{selectedTicketGuest.familyName}</h3>
                    <p className="text-sm text-slate-500">Pases Autorizados: <span className="font-bold text-slate-900">{selectedTicketGuest.members.length}</span></p>
                </div>

                {/* QR CODE */}
                <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-100">
                    <QRCode 
                        value={selectedTicketGuest.id || "error"} 
                        size={200}
                        level="H" // Alta corrección de errores
                    />
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">ID: {selectedTicketGuest.id?.slice(0,8)}...</p>

                {/* DETALLE DE MESAS */}
                <div className="w-full bg-slate-50 p-4 rounded-lg text-left space-y-2 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase">Distribución de Asientos</p>
                    <div className="text-sm space-y-1 text-slate-700 max-h-32 overflow-y-auto">
                        {selectedTicketGuest.members.map((m, i) => (
                            <div key={i} className="flex justify-between border-b border-slate-200 pb-1 last:border-0">
                                <span>{m.name}</span>
                                {/* Lógica visual rápida para mostrar si tiene mesa */}
                                <span className={m.tableId ? "font-bold text-slate-900" : "text-slate-400 italic"}>
                                    {m.tableId ? "Mesa Asignada" : "Sin Mesa"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ACCIONES */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Button variant="outline" onClick={() => setSelectedTicketGuest(null)}>Cerrar</Button>
                    <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => shareTicket(selectedTicketGuest)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Enviar
                    </Button>
                </div>
            </div>
        </Modal>
      )}

    </div>
  );
}