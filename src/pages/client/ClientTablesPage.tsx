import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ArrowRight, 
  XCircle,
  UserX,
  CheckCircle2,
  Clock,
  FileDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tableService, TableData } from "@/services/tableService";
import { guestService, GuestData } from "@/services/guestService";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function ClientTablesPage() {
  const navigate = useNavigate();
  const { clientEvent } = useAuthStore();
  
  const [tables, setTables] = useState<TableData[]>([]);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "Mesa 1", capacity: "10" });

  useEffect(() => {
    if (!clientEvent?.id) return;
    const unsubTables = tableService.subscribeByEvent(clientEvent.id, setTables);
    const unsubGuests = guestService.subscribeByEvent(clientEvent.id, setGuests);
    return () => { unsubTables(); unsubGuests(); };
  }, [clientEvent?.id]);

  // --- PDF GENERATOR ---
  const handleDownloadPDF = () => {
    if (!clientEvent) return;

    const doc = new jsPDF({ orientation: 'landscape' });
    const eventName = clientEvent.name || "Evento";
    const eventDate = clientEvent.date 
      ? new Date(clientEvent.date).toLocaleDateString("es-MX", { dateStyle: "long" }) 
      : "";

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const gap = 5; 
    const columns = 4; 
    const tableWidth = (pageWidth - (margin * 2) - (gap * (columns - 1))) / columns;

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(eventName, margin, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Distribución de Mesas - ${eventDate}`, margin, 22);
    doc.line(margin, 25, pageWidth - margin, 25);

    let startY = 30;
    let maxRowHeight = 0;
    
    // Ordenar mesas numéricamente si es posible
    const sortedTables = [...tables].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );

    sortedTables.forEach((table, index) => {
      if (index > 0 && index % columns === 0) {
        startY = maxRowHeight + 10; 
      }

      if (startY > pageHeight - 30) {
        doc.addPage();
        startY = 20; 
        maxRowHeight = 20;
      }

      const colIndex = index % columns;
      const currentX = margin + (colIndex * (tableWidth + gap));

      const assignedMembers = guests.flatMap(g => g.members)
        .filter(m => m.tableId === table.id)
        .map(m => ({ 
            name: m.name, 
            status: m.isConfirmed ? "OK" : "P" 
        }));

      const tableRows = assignedMembers.length > 0 
        ? assignedMembers.map(m => [
            m.name.length > 18 ? m.name.substring(0, 16) + ".." : m.name,
            m.status
          ])
        : [["(Vacía)", "-"]];

      autoTable(doc, {
        startY: startY,
        margin: { left: currentX },
        tableWidth: tableWidth,
        head: [[table.name.toUpperCase(), "EST"]],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [236, 72, 153],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          overflow: 'ellipsize',
          valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 10, halign: 'center' }
        },
        didDrawPage: (data) => {
           if (data.cursor && data.cursor.y > maxRowHeight) {
               maxRowHeight = data.cursor.y;
           }
        }
      });
      
      // @ts-ignore
      if (doc.lastAutoTable.finalY > maxRowHeight) {
        // @ts-ignore
        maxRowHeight = doc.lastAutoTable.finalY;
      }
    });

    const totalAssigned = guests.flatMap(g => g.members).filter(m => m.tableId).length;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Total Invitados Asignados: ${totalAssigned}`, margin, pageHeight - 5);
    doc.text(`Leyenda: OK = Confirmado, P = Pendiente`, pageWidth - 60, pageHeight - 5);

    doc.save(`Mesas_Grid_${eventName.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF descargado correctamente");
  };

  // --- ESTADÍSTICAS ---
  const getTableStats = (tableId: string) => {
    let confirmed = 0;
    let pending = 0;
    let declined = 0;

    guests.forEach(group => {
      group.members?.forEach(member => {
        if (member.tableId === tableId) {
          if (group.status === 'pending') {
            pending++;
          } else if (group.status === 'declined') {
            declined++;
          } else { 
            if (member.isConfirmed) confirmed++;
            else declined++;
          }
        }
      });
    });
    return { confirmed, pending, declined };
  };

  const getTotalUnassigned = () => {
    let count = 0;
    guests.forEach(group => {
      if (group.status === 'declined') return;
      group.members?.forEach(member => {
         const isValid = group.status === 'pending' || (group.status === 'confirmed' && member.isConfirmed);
         if (isValid && !member.tableId) count++;
      });
    });
    return count;
  };

  // --- ACTIONS ---
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEvent?.id) return;
    setLoading(true);
    try {
      await tableService.add({
        eventId: clientEvent.id,
        name: formData.name,
        capacity: parseInt(formData.capacity)
      });
      setIsCreateModalOpen(false);
      toast.success("Mesa creada");
      const nextNum = parseInt(formData.name.replace(/\D/g, '')) + 1;
      setFormData({ name: isNaN(nextNum) ? "Mesa" : `Mesa ${nextNum}`, capacity: formData.capacity });
    } catch (error) {
      toast.error("Error al crear mesa: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("¿Borrar mesa? Los invitados confirmados volverán a la lista sin asignar.")) {
      await tableService.delete(id);
      toast.success("Mesa eliminada");
    }
  };

  const handleAssignMember = async (guestId: string, memberName: string, tableId: string | null) => {
    try {
      await guestService.assignMember(guestId, memberName, tableId);
    } catch (error) {
      toast.error("Error al asignar: " + error);
    }
  };

  // --- DATA PROCESSING FOR MODAL ---
  const membersInTable = selectedTable 
    ? guests.flatMap(group => 
        group.members
          .filter(m => m.tableId === selectedTable.id)
          .map(m => {
            let status: 'confirmed' | 'pending' | 'declined' = 'pending';
            if (group.status === 'confirmed' && m.isConfirmed) status = 'confirmed';
            else if (group.status === 'confirmed' && !m.isConfirmed) status = 'declined';
            else if (group.status === 'declined') status = 'declined';
            return { ...m, guestId: group.id, familyName: group.familyName, status };
          })
      )
    : [];
  
  const membersUnassigned = guests.flatMap(group => 
    group.members
      .filter(m => !m.tableId)
      .filter(m => {
          if (group.status === 'declined') return false;
          if (group.status === 'confirmed' && !m.isConfirmed) return false;
          return true;
      })
      .map(m => ({ ...m, guestId: group.id, familyName: group.familyName, status: group.status }))
  );
  
  const stats = selectedTable ? getTableStats(selectedTable.id!) : { confirmed: 0, pending: 0, declined: 0 };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-muted-foreground p-0 lg:hidden">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-black text-foreground">Mesas</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
            {getTotalUnassigned()} sin lugar asignado
            </p>

            <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                    onClick={handleDownloadPDF} 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <FileDown className="w-4 h-4 mr-2 text-pink-500" />
                    PDF
                </Button>

                <Button onClick={() => setIsCreateModalOpen(true)} className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-600/20">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Mesa
                </Button>
            </div>
        </div>
      </div>

      {/* Grid Mesas - ESTILO ORIGINAL PRESERVADO */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map(table => {
          const { confirmed, pending, declined } = getTableStats(table.id!);
          const totalAssigned = confirmed + pending; 
          const isFull = totalAssigned >= table.capacity;

          return (
            <motion.div layout key={table.id}>
              <Card onClick={() => setSelectedTable(table)} className={cn(
                "bg-slate-900/40 border-slate-800 relative cursor-pointer hover:border-purple-500 transition-all",
                isFull && "bg-purple-500/5"
              )}>
                <div className="absolute top-2 right-2 z-10">
                  <Button variant="ghost" size="sm" onClick={(e) => handleDeleteTable(e, table.id!)} className="h-8 w-8 p-0 text-slate-600 hover:text-red-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
                <CardHeader className="pb-2 pt-6 text-center">
                  <CardTitle className="text-lg font-bold text-white truncate">{table.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3 pb-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-3xl font-black", totalAssigned > table.capacity ? "text-red-500" : "text-white")}>{totalAssigned}</span>
                      <span className="text-xs font-bold text-slate-500">/ {table.capacity}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {pending > 0 && <Badge className="bg-yellow-500/20 text-yellow-500 border-none text-[9px]">{pending} ESPERA</Badge>}
                      {declined > 0 && <Badge className="bg-red-500/20 text-red-500 border-none text-[9px]">{declined} CANCELADO</Badge>}
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500", totalAssigned > table.capacity ? "bg-red-500" : isFull ? "bg-purple-400" : "bg-primary")} style={{ width: `${Math.min((totalAssigned / table.capacity) * 100, 100)}%` }} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL GESTIÓN - ESTILO ORIGINAL PRESERVADO */}
      <AnimatePresence>
        {selectedTable && (
          <Modal isOpen={!!selectedTable} onClose={() => setSelectedTable(null)} title={selectedTable.name}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                  <p className="text-[10px] font-bold text-green-500 uppercase">Van</p>
                  <p className="text-xl font-black text-white">{stats.confirmed}</p>
                </div>
                <div className="bg-yellow-500/10 p-2 rounded-xl border border-yellow-500/20">
                  <p className="text-[10px] font-bold text-yellow-500 uppercase">Espera</p>
                  <p className="text-xl font-black text-white">{stats.pending}</p>
                </div>
                <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                  <p className="text-[10px] font-bold text-red-500 uppercase">No van</p>
                  <p className="text-xl font-black text-white">{stats.declined}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh] md:h-[400px]">
                {/* COLUMNA 1: EN LA MESA */}
                <div className="flex flex-col border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-[10px] text-slate-500 uppercase tracking-widest">En esta mesa</div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {membersInTable.map((m, i) => (
                      <div key={i} className={cn("flex items-center justify-between p-3 rounded-xl border", m.status === 'confirmed' ? "bg-slate-900 border-slate-800" : m.status === 'pending' ? "bg-yellow-500/5 border-yellow-500/20" : "bg-red-500/5 border-red-500/20 opacity-70")}>
                        <div className="flex items-center gap-3">
                          {m.status === 'confirmed' ? <CheckCircle2 size={16} className="text-green-500" /> : m.status === 'pending' ? <Clock size={16} className="text-yellow-500" /> : <UserX size={16} className="text-red-400" />}
                          <div className="min-w-0">
                            <p className={cn("text-sm font-bold truncate text-white", m.status === 'declined' && "line-through text-slate-500")}>{m.name}</p>
                            <p className="text-[10px] text-slate-500 truncate uppercase">{m.familyName}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleAssignMember(m.guestId!, m.name, null)} className="text-slate-600 hover:text-red-400 p-0 h-8 w-8"><XCircle size={18} /></Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* COLUMNA 2: SIN MESA */}
                <div className="flex flex-col border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-[10px] text-slate-500 uppercase tracking-widest">Sin asignar (Conf. o Pend.)</div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {membersUnassigned.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-bold text-white truncate">{m.name}</p>
                             {m.status === 'pending' && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1 rounded">PEND</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 uppercase">{m.familyName}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleAssignMember(m.guestId!, m.name, selectedTable.id!)} className="text-primary hover:bg-primary/10 p-0 h-8 w-8"><ArrowRight size={18} /></Button>
                      </div>
                    ))}
                    {membersUnassigned.length === 0 && (
                        <p className="text-center text-xs text-slate-500 mt-4">No hay invitados disponibles para asignar.</p>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={() => setSelectedTable(null)} className="w-full h-12 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700">Cerrar</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* MODAL CREAR MESA */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Nueva Mesa">
        <form onSubmit={handleCreateTable} className="space-y-6">
          <div className="space-y-2"><Label>Nombre</Label><Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-950 border-slate-800 text-white" /></div>
          <div className="space-y-2"><Label>Capacidad</Label><Input type="number" min="1" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="bg-slate-950 border-slate-800 text-white" /></div>
          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-bold bg-purple-600 hover:bg-purple-500 text-white">
            {loading ? "Creando..." : "Crear Mesa"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}