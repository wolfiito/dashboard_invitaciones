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
  CopyCheck,
  MoreVertical
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { guestService, GuestData, GuestType, GuestMember } from "@/services/guestService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  
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

  const copyInvitationLink = (guest: GuestData) => {
    if (!clientEvent?.invitationUrl) {
      toast.error("URL no configurada");
      return;
    }
    const cleanBaseUrl = clientEvent.invitationUrl.replace(/\/$/, "");
    const uniqueLink = `${cleanBaseUrl}/?ticket=${guest.id}`;
    
    navigator.clipboard.writeText(uniqueLink);
    setCopiedId(guest.id || null);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Enlace copiado");
  };

  const handleSave = async () => {
    if (!clientEvent?.id || !familyName.trim()) {
      toast.error("Faltan datos obligatorios");
      return;
    }

    setIsLoading(true);
    let finalMembers: GuestMember[] = [];

    if (type === 'individual') {
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
      toast.success("Guardado");
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };

  const shareInvitation = (guest: GuestData) => {
    if (!clientEvent?.invitationUrl) return;
    const cleanBaseUrl = clientEvent.invitationUrl.replace(/\/$/, "");
    const uniqueLink = `${cleanBaseUrl}/?ticket=${guest.id}`;
    const message = `Hola *${guest.type === 'family' ? 'Familia ' : ''}${guest.familyName}* ✨\n\nTe invitamos a nuestra boda. Confirma aquí: ${uniqueLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.familyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || g.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client/dashboard")} className="lg:hidden">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Invitados</h1>
            <p className="text-muted-foreground text-sm font-medium">Gestiona pases y confirmaciones</p>
          </div>
        </div>
        
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full h-12 rounded-xl gap-2 shadow-lg shadow-primary/20 font-bold">
          <Plus size={18} />
          Nuevo Invitado
        </Button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <Input 
            placeholder="Buscar por nombre..." 
            className="pl-10 h-12 bg-card border-border/50 rounded-xl focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'confirmed', 'pending', 'declined'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                filter === f 
                  ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {f === 'all' ? 'Todos' : f === 'confirmed' ? 'Listos' : f === 'pending' ? 'Pendientes' : 'Cancelados'}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE TARJETAS */}
      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {filteredGuests.map((guest) => (
            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={guest.id}>
              <Card className="p-4 border-border/50 bg-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      guest.type === 'family' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {guest.type === 'family' ? <Home size={20} /> : <User size={20} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground truncate leading-none mb-1">
                        {guest.type === 'family' ? `Fam. ${guest.familyName}` : guest.familyName}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        {guest.members.length} {guest.members.length === 1 ? 'Invitado' : 'Integrantes'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full ring-4 ring-background",
                    guest.status === 'confirmed' ? "bg-green-500" : guest.status === 'declined' ? "bg-red-500" : "bg-yellow-500"
                  )} />
                </div>

                {/* BOTONES DE ACCIÓN INTEGRADOS */}
                <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-4">
      <div className="flex gap-2">
        {/* WhatsApp */}
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-green-600 hover:bg-green-500/10 hover:text-green-500 border-none transition-all active:scale-90"
          onClick={() => shareInvitation(guest)}
        >
          <MessageCircle size={18} />
        </Button>

        {/* Copiar Link */}
        <Button 
          variant="secondary" 
          size="icon" 
          className={cn(
            "h-10 w-10 rounded-xl border-none transition-all active:scale-90",
            copiedId === guest.id ? "text-green-500 bg-green-500/10" : "text-blue-600 hover:bg-blue-500/10 hover:text-blue-500"
          )}
          onClick={() => copyInvitationLink(guest)}
        >
          {copiedId === guest.id ? <CopyCheck size={18} /> : <Link size={18} />}
        </Button>

        {/* Ticket QR */}
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-slate-500 hover:bg-slate-500/10 hover:text-slate-700 border-none transition-all active:scale-90"
          onClick={() => setSelectedTicketGuest(guest)}
        >
          <QrCode size={18} />
        </Button>
      </div>

      <div className="flex gap-2">
        {/* Editar: Ahora es un icono para mantener la línea visual */}
        <Button 
          variant="secondary" 
          size="icon"
          className="h-10 w-10 rounded-xl text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 border-none transition-all active:scale-90"
          onClick={() => navigate(`/client/guests/edit/${guest.id}`)}
        >
          <PlusCircle className="rotate-45" size={18} /> {/* Usamos un icono de ajuste/edit */}
        </Button>

        {/* Eliminar */}
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-600 border-none transition-all active:scale-90"
          onClick={() => { if(confirm("¿Eliminar invitado?")) guestService.delete(guest.id!) }}
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- MODAL REGISTRO (Tu lógica original con mi diseño) --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalView === 'form' ? "Nuevo Invitado" : "¡Agregado!"}>
        {modalView === 'form' ? (
          <div className="space-y-6">
            <div className="flex p-1 bg-muted rounded-2xl border border-border">
              <button onClick={() => setType('individual')} className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", type === 'individual' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
                Individual
              </button>
              <button onClick={() => setType('family')} className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", type === 'family' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
                Familia
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">{type === 'individual' ? 'Nombre' : 'Apellidos'}</Label>
                <Input placeholder={type === 'individual' ? "Ej. Carlos Slim" : "Ej. Pérez"} value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="h-12 rounded-xl" />
              </div>

              {type === 'individual' ? (
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">Boletos</Label>
                  <div className="flex items-center justify-between bg-muted p-2 rounded-2xl">
                    <Button variant="ghost" size="icon" onClick={() => setTickets(Math.max(1, tickets - 1))} className="h-10 w-10 font-bold">-</Button>
                    <span className="text-xl font-black">{tickets}</span>
                    <Button variant="ghost" size="icon" onClick={() => setTickets(tickets + 1)} className="h-10 w-10 font-bold">+</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">Integrantes</Label>
                      <Button variant="ghost" size="sm" onClick={() => setMemberNames([...memberNames, ""])} className="h-7 text-primary font-bold text-[10px] uppercase">
                        <PlusCircle size={14} className="mr-1" /> Añadir
                      </Button>
                   </div>
                   <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {memberNames.map((name, index) => (
                      <div key={index} className="flex gap-2">
                        <Input placeholder={`Nombre ${index + 1}`} value={name} onChange={(e) => { const n = [...memberNames]; n[index] = e.target.value; setMemberNames(n); }} className="h-10 rounded-xl" />
                        {memberNames.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => setMemberNames(memberNames.filter((_, i) => i !== index))} className="text-red-400"><X size={18} /></Button>
                        )}
                      </div>
                    ))}
                   </div>
                </div>
              )}
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="w-full h-14 rounded-2xl font-bold text-lg">{isLoading ? "Guardando..." : "Guardar Invitado"}</Button>
          </div>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce"><Check size={40} /></div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">¡Todo listo!</h3>
              <p className="text-muted-foreground text-sm">El invitado ha sido registrado correctamente.</p>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => shareInvitation(lastSavedGuest!)} className="h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold gap-2">
                <MessageCircle size={20} /> Enviar WhatsApp
              </Button>
              <Button variant="outline" onClick={() => resetForm()} className="h-12 rounded-xl font-bold">Agregar otro</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL TICKET QR (Tu lógica original con mi diseño) --- */}
      <Modal isOpen={!!selectedTicketGuest} onClose={() => setSelectedTicketGuest(null)} title="Boleto Digital">
        {selectedTicketGuest && (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black tracking-tight">{selectedTicketGuest.familyName}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedTicketGuest.members.length} Pases</p>
            </div>

            <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-muted">
              <QRCode value={selectedTicketGuest.id || "error"} size={180} />
            </div>

            <div className="w-full bg-muted/50 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2 text-center">Detalle de pases</p>
              <div className="max-h-32 overflow-y-auto space-y-2 px-2">
                {selectedTicketGuest.members.map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-sm font-medium">
                    <span>{m.name}</span>
                    <span className="text-[10px] bg-background px-2 py-0.5 rounded-full border border-border">Mesa: {m.tableId || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Ticket: ' + selectedTicketGuest.id)}`, '_blank')} className="w-full h-12 rounded-xl font-bold">
               Compartir Ticket
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}