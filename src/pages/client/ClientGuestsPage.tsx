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
  Copy // Icono para copiar vínculo
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

  // --- ESTADOS DE LA LISTA ---
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- ESTADOS DE CONTROL DE MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedGuest, setLastSavedGuest] = useState<GuestData | null>(null);
  const [selectedTicketGuest, setSelectedTicketGuest] = useState<GuestData | null>(null);

  // --- ESTADOS DEL FORMULARIO ---
  const [type, setType] = useState<GuestType>('individual');
  const [familyName, setFamilyName] = useState("");
  const [tickets, setTickets] = useState(1);
  const [memberNames, setMemberNames] = useState<string[]>([""]);

  // --- EFECTO: SUSCRIPCIÓN EN TIEMPO REAL ---
  useEffect(() => {
    if (!clientEvent?.id) return;
    const unsubscribe = guestService.subscribeByEvent(clientEvent.id, setGuests);
    return () => unsubscribe();
  }, [clientEvent?.id]);

  // --- LÓGICA DE GESTIÓN DE MIEMBROS ---
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

  // --- LÓGICA DE COPIAR VÍNCULO ---
  const copyInvitationLink = (guest: GuestData) => {
    if (!clientEvent?.invitationUrl) {
      toast.error("El evento no tiene configurada una URL de invitación.");
      return;
    }

    const cleanBaseUrl = clientEvent.invitationUrl.endsWith('/') 
      ? clientEvent.invitationUrl.slice(0, -1) 
      : clientEvent.invitationUrl;

    const uniqueLink = `${cleanBaseUrl}/?ticket=${guest.id}`;
    
    navigator.clipboard.writeText(uniqueLink);
    toast.success("Vínculo copiado al portapapeles");
  };

  const handleSave = async () => {
    if (!clientEvent?.id || !familyName.trim()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setIsLoading(true);
    let finalMembers: GuestMember[] = [];

    if (type === 'individual') {
      finalMembers = Array.from({ length: tickets }).map((_, i) => ({
        name: i === 0 ? familyName : `Acompañante de ${familyName}`,
        isConfirmed: false
      }));
    } else {
      const filteredNames = memberNames.filter(n => n.trim() !== "");
      if (filteredNames.length === 0) {
        toast.error("Agrega al menos un integrante");
        setIsLoading(false);
        return;
      }
      finalMembers = filteredNames.map(name => ({ name, isConfirmed: false }));
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
      toast.error("Error al guardar en el servidor" + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (guestId: string) => {
    if (confirm("¿Estás seguro de eliminar este invitado?")) {
      try {
        await guestService.delete(guestId);
        toast.success("Eliminado");
      } catch (e) {
        toast.error("No se pudo eliminar" + e);
      }
    }
  };

  // --- LÓGICA DE COMPARTIR ---
  const shareInvitation = (guest: GuestData) => {
    if (!clientEvent?.invitationUrl) {
      toast.error("El evento no tiene configurada una URL de invitación.");
      return;
    }

    const cleanBaseUrl = clientEvent.invitationUrl.endsWith('/') 
      ? clientEvent.invitationUrl.slice(0, -1) 
      : clientEvent.invitationUrl;

    const uniqueLink = `${cleanBaseUrl}/?ticket=${guest.id}`;
    const message = `Hola ${guest.type === 'family' ? 'Familia ' : ''}${guest.familyName} 👋,\n\nNos encantaría que nos acompañen en nuestro evento.\nHemos reservado ${guest.members.length} lugares para ustedes.\n\nConfirmen su asistencia aquí: ${uniqueLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareTicket = (guest: GuestData) => {
    const summary = guest.members.map(m => `• ${m.name}: ${m.tableId ? 'Mesa asignada' : 'Por asignar'}`).join('\n');
    const message = `Hola ${guest.familyName}, aquí tienes tus accesos confirmados:\n\n${summary}\n\nPresenta tu ID al llegar: ${guest.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredGuests = guests.filter(g => 
    g.familyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-slate-400">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-black text-white">Mis Invitados</h1>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input 
              placeholder="Buscar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800"
            />
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

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
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      guest.type === 'family' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                    )}>
                      {guest.type === 'family' ? <Home size={24} /> : <User size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white leading-tight">
                        {guest.type === 'family' ? `Fam. ${guest.familyName}` : guest.familyName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0 border-slate-700 text-slate-400">
                          {guest.members.length} pases
                        </Badge>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          guest.status === 'confirmed' ? "bg-green-500" : guest.status === 'declined' ? "bg-red-500" : "bg-yellow-500"
                        )} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Botón Copiar Link */}
                    <Button variant="ghost" size="sm" onClick={() => copyInvitationLink(guest)} className="text-slate-500 hover:text-primary">
                      <Copy size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTicketGuest(guest)} className="text-slate-500 hover:text-blue-400">
                      <QrCode size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => shareInvitation(guest)} className="text-slate-500 hover:text-green-400">
                      <MessageCircle size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(guest.id!)} className="text-slate-500 hover:text-red-400">
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalView === 'form' ? "Nuevo Invitado" : "¡Invitado Agregado!"}
      >
        {modalView === 'form' ? (
          <div className="space-y-6">
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button 
                onClick={() => setType('individual')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all",
                  type === 'individual' ? "bg-primary text-white" : "text-slate-500"
                )}
              >
                <User size={18} /> Individual
              </button>
              <button 
                onClick={() => setType('family')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all",
                  type === 'family' ? "bg-primary text-white" : "text-slate-500"
                )}
              >
                <Home size={18} /> Familia
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black text-slate-500 tracking-widest">
                  {type === 'individual' ? 'Nombre del Invitado' : 'Apellidos de la Familia'}
                </Label>
                <Input 
                  placeholder={type === 'individual' ? "Ej. Carlos Slim" : "Ej. Pérez García"}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="bg-slate-950 border-slate-800 h-12 text-white"
                />
              </div>

              {type === 'individual' ? (
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-black text-slate-500 tracking-widest">Boletos / Lugares</Label>
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
                        <Input 
                          placeholder={`Nombre integrante ${index + 1}`}
                          value={name}
                          onChange={(e) => {
                            const n = [...memberNames];
                            n[index] = e.target.value;
                            setMemberNames(n);
                          }}
                          className="bg-slate-950 border-slate-800"
                        />
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMemberField(index)} className="text-slate-600">
                          <X size={18} />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" onClick={handleAddMemberField} className="w-full border-2 border-dashed border-slate-800 text-slate-500 hover:text-primary">
                    <PlusCircle size={16} className="mr-2" /> Añadir integrante
                  </Button>
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={isLoading} className="w-full h-14 rounded-2xl font-bold text-lg">
              {isLoading ? "Guardando..." : "Guardar Invitado"}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">¡Invitado Agregado!</h3>
              <p className="text-slate-400 text-sm">Ya puedes enviarle su invitación digital.</p>
            </div>
            
            <div className="space-y-3">
              <Button onClick={() => shareInvitation(lastSavedGuest!)} className="w-full h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold">
                <MessageCircle className="mr-2" /> Enviar por WhatsApp
              </Button>
              {/* Botón Copiar Link en Éxito */}
              <Button onClick={() => copyInvitationLink(lastSavedGuest!)} variant="outline" className="w-full h-14 border-slate-700 text-slate-300 rounded-2xl font-bold">
                <Copy className="mr-2" /> Copiar Vínculo
              </Button>
              <Button variant="ghost" onClick={() => resetForm()} className="w-full text-slate-500">
                Registrar otro invitado
              </Button>
            </div>
          </div>
        )}
      </Modal>

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