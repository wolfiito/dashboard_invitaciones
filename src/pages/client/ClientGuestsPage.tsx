// src/pages/client/ClientGuestsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  Check, 
  MessageCircle, 
  X, 
  QrCode, 
  Search, 
  User, 
  Home, 
  PlusCircle, 
  ArrowLeft,
  Link, 
  CopyCheck 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { guestService, GuestData, GuestType, GuestMember } from "@/services/guestService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code"; 
import { cn } from "@/lib/utils";

export function ClientGuestsPage() {
  const { clientEvent } = useAuthStore();
  const navigate = useNavigate();

  // Estados
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedGuest, setLastSavedGuest] = useState<GuestData | null>(null);
  const [selectedTicketGuest, setSelectedTicketGuest] = useState<GuestData | null>(null);

  // Formulario
  const [type, setType] = useState<GuestType>('individual');
  const [familyName, setFamilyName] = useState("");
  const [tickets, setTickets] = useState(1);
  const [memberNames, setMemberNames] = useState<string[]>([""]);

  useEffect(() => {
    if (!clientEvent?.id) return;
    const unsubscribe = guestService.subscribeByEvent(clientEvent.id, setGuests);
    return () => unsubscribe();
  }, [clientEvent?.id]);

  const resetForm = () => {
    setType('individual');
    setFamilyName("");
    setTickets(1);
    setMemberNames([""]);
    setModalView('form');
  };

  const handleAddMemberField = () => setMemberNames([...memberNames, ""]);
  
  const handleRemoveMemberField = (index: number) => {
    if (memberNames.length > 1) {
      setMemberNames(memberNames.filter((_, i) => i !== index));
    }
  };

  const copyInvitationLink = (guest: GuestData) => {
    if (!clientEvent?.invitationUrl) {
      toast.error("El evento no tiene configurada una URL.");
      return;
    }
    const cleanBaseUrl = clientEvent.invitationUrl.endsWith('/') 
      ? clientEvent.invitationUrl.slice(0, -1) 
      : clientEvent.invitationUrl;

    const uniqueLink = `${cleanBaseUrl}/?ticket=${guest.id}`;
    
    navigator.clipboard.writeText(uniqueLink);
    if (navigator.vibrate) navigator.vibrate(50);

    toast.success("Vínculo copiado", { description: `Invitación de ${guest.familyName}` });

    if (guest.id) {
        setCopiedId(guest.id);
        setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // --- CORRECCIÓN AQUÍ ---
  const handleSave = async () => {
    if (!clientEvent?.id || !familyName.trim()) {
      toast.error("Faltan datos obligatorios");
      return;
    }

    setIsLoading(true);
    let finalMembers: GuestMember[] = [];

    if (type === 'individual') {
      // CORRECCIÓN: Agregamos el índice 'i' al nombre del acompañante
      // Esto hace que cada nombre sea único: "Acompañante 1", "Acompañante 2", etc.
      finalMembers = Array.from({ length: tickets }).map((_, i) => ({
        name: i === 0 ? familyName : `Acompañante ${i} de ${familyName}`, 
        isConfirmed: false
      }));
    } else {
      const filteredNames = memberNames.filter(n => n.trim() !== "");
      if (filteredNames.length === 0) {
        toast.error("Agrega al menos un integrante");
        setIsLoading(false);
        return;
      }
      // Validamos que no haya nombres duplicados en la familia manualmente
      const uniqueNames = [...new Set(filteredNames)];
      if (uniqueNames.length !== filteredNames.length) {
          toast.warning("Se eliminaron nombres duplicados automáticamente.");
      }
      finalMembers = uniqueNames.map(name => ({ name, isConfirmed: false }));
    }

    const newGuest: Omit<GuestData, 'id'> = {
      eventId: clientEvent.id,
      type,
      familyName,
      members: finalMembers,
      status: 'pending'
    };

    try {
      const newId = await guestService.add(newGuest);
      setLastSavedGuest({ ...newGuest, id: newId } as GuestData);
      setModalView('success');
      toast.success("Guardado exitosamente");
    } catch (error) {
      toast.error("Error al guardar" + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (guestId: string) => {
    if (confirm("¿Borrar invitado?")) {
      try {
        await guestService.delete(guestId);
        toast.success("Eliminado");
      } catch (e) { toast.error("Error al eliminar" + e); }
    }
  };

  const shareInvitation = (guest: GuestData) => {
    if (!clientEvent?.invitationUrl) { toast.error("Falta URL del evento"); return; }
    const cleanBaseUrl = clientEvent.invitationUrl.endsWith('/') ? clientEvent.invitationUrl.slice(0, -1) : clientEvent.invitationUrl;
    const uniqueLink = `${cleanBaseUrl}/?ticket=${guest.id}`;
    const message = `Hola ${guest.type === 'family' ? 'Familia ' : ''}${guest.familyName} 👋,\n\nConfirmen su asistencia aquí: ${uniqueLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareTicket = (guest: GuestData) => {
    const summary = guest.members.map(m => `• ${m.name}: ${m.tableId ? 'Mesa OK' : 'Por asignar'}`).join('\n');
    const message = `Sus accesos confirmados:\n\n${summary}\n\nQR ID: ${guest.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredGuests = guests.filter(g => 
    g.familyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-slate-400 p-0">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-black text-white">Mis Invitados</h1>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800"
            />
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20 aspect-square p-0 w-10">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* LISTA RESPONSIVA */}
      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence>
          {filteredGuests.map((guest) => (
            <motion.div 
              key={guest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Info del Invitado */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center",
                      guest.type === 'family' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                    )}>
                      {guest.type === 'family' ? <Home size={20} /> : <User size={20} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white leading-tight truncate">
                        {guest.type === 'family' ? `Fam. ${guest.familyName}` : guest.familyName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-700 text-slate-400">
                          {guest.members.length} {guest.members.length === 1 ? 'pase' : 'pases'}
                        </Badge>
                        <span className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          guest.status === 'confirmed' ? "bg-green-500" : guest.status === 'declined' ? "bg-red-500" : "bg-yellow-500"
                        )} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyInvitationLink(guest)} 
                        className={cn(
                            "h-9 w-9 p-0 transition-all",
                            copiedId === guest.id ? "text-green-500 bg-green-500/10" : "text-slate-500 hover:text-primary"
                        )}
                        title="Copiar Enlace"
                    >
                      {copiedId === guest.id ? <CopyCheck size={18} /> : <Link size={18} />}
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicketGuest(guest)} className="text-slate-500 hover:text-blue-400 h-9 w-9 p-0">
                      <QrCode size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => shareInvitation(guest)} className="text-slate-500 hover:text-green-400 h-9 w-9 p-0">
                      <MessageCircle size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(guest.id!)} className="text-slate-500 hover:text-red-400 h-9 w-9 p-0">
                      <Trash2 size={18} />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- MODAL REGISTRO --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalView === 'form' ? "Nuevo Invitado" : "¡Agregado!"}>
        {modalView === 'form' ? (
          <div className="space-y-6">
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button onClick={() => setType('individual')} className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", type === 'individual' ? "bg-primary text-white" : "text-slate-500")}>
                <User size={18} className="inline mr-2"/> Individual
              </button>
              <button onClick={() => setType('family')} className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", type === 'family' ? "bg-primary text-white" : "text-slate-500")}>
                <Home size={18} className="inline mr-2"/> Familia
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black text-slate-500 tracking-widest">{type === 'individual' ? 'Nombre' : 'Apellidos'}</Label>
                <Input placeholder={type === 'individual' ? "Ej. Carlos Slim" : "Ej. Pérez"} value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="bg-slate-950 border-slate-800 h-12 text-white" />
              </div>

              {type === 'individual' ? (
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-black text-slate-500 tracking-widest">Boletos</Label>
                  <div className="flex items-center gap-6 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                    <Button variant="ghost" onClick={() => setTickets(Math.max(1, tickets - 1))} className="text-xl font-bold">-</Button>
                    <span className="flex-1 text-center text-2xl font-black text-white">{tickets}</span>
                    <Button variant="ghost" onClick={() => setTickets(tickets + 1)} className="text-xl font-bold">+</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-xs uppercase font-black text-slate-500 tracking-widest">Integrantes</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {memberNames.map((name, index) => (
                      <div key={index} className="flex gap-2">
                        <Input placeholder={`Nombre ${index + 1}`} value={name} onChange={(e) => { const n = [...memberNames]; n[index] = e.target.value; setMemberNames(n); }} className="bg-slate-950 border-slate-800" />
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMemberField(index)}><X size={18} /></Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" onClick={handleAddMemberField} className="w-full border-2 border-dashed border-slate-800 text-slate-500"><PlusCircle size={16} className="mr-2" /> Añadir</Button>
                </div>
              )}
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="w-full h-14 rounded-2xl font-bold text-lg">{isLoading ? "..." : "Guardar"}</Button>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto"><Check size={32} /></div>
            <h3 className="text-2xl font-black text-white">¡Listo!</h3>
            
            <div className="space-y-2">
              <Button onClick={() => shareInvitation(lastSavedGuest!)} className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold">
                <MessageCircle className="mr-2" /> Enviar WhatsApp
              </Button>
              <Button 
                onClick={() => lastSavedGuest && copyInvitationLink(lastSavedGuest)} 
                variant="outline" 
                className={cn(
                    "w-full h-12 border-slate-700 rounded-xl font-bold hover:bg-slate-800 transition-colors",
                    copiedId === lastSavedGuest?.id ? "text-green-500 border-green-500/50 bg-green-500/10" : "text-slate-300"
                )}
              >
                {copiedId === lastSavedGuest?.id ? <CopyCheck className="mr-2" /> : <Link className="mr-2" size={18} />}
                {copiedId === lastSavedGuest?.id ? "¡Copiado!" : "Copiar Enlace"}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => resetForm()} className="w-full text-slate-500 text-xs uppercase tracking-widest mt-2">Nuevo Registro</Button>
          </div>
        )}
      </Modal>

      {/* --- MODAL TICKET QR --- */}
      <AnimatePresence>
        {selectedTicketGuest && (
          <Modal isOpen={!!selectedTicketGuest} onClose={() => setSelectedTicketGuest(null)} title="Boleto Digital">
            <div className="flex flex-col items-center space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-black text-white">{selectedTicketGuest.familyName}</h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{selectedTicketGuest.members.length} Pases Confirmados</p>
              </div>

              <div className="p-6 bg-white rounded-3xl shadow-2xl">
                <QRCode value={selectedTicketGuest.id || "error"} size={200} />
              </div>

              <div className="w-full space-y-3 text-slate-900 bg-white p-4 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Distribución de Asientos</p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {selectedTicketGuest.members.map((m, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-800 font-medium">{m.name}</span>
                      <span className="text-slate-400 text-xs">{m.tableId ? 'Mesa OK' : 'Por asignar'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => shareTicket(selectedTicketGuest)} className="w-full h-12 rounded-xl">
                <MessageCircle size={18} className="mr-2" /> Re-enviar Ticket
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}