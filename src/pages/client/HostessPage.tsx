// src/pages/client/HostessPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Users, 
  RefreshCw,
  UserX,
  Armchair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guestService, GuestData } from "@/services/guestService";
import { tableService, TableData } from "@/services/tableService";
import { useAuthStore } from "@/store/useAuthStore";

export function HostessPage() {
  const navigate = useNavigate();
  const { clientEvent } = useAuthStore();
  
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  useEffect(() => {
    if (!clientEvent?.id) return;
    const unsubscribe = tableService.subscribeByEvent(clientEvent.id, (data) => {
      setTables(data);
    });
    return () => unsubscribe();
  }, [clientEvent?.id]);

  const playSuccessSound = () => {
    if (navigator.vibrate) navigator.vibrate(200);
  };

  const handleScan = async (result: string) => {
    if (!result || loading || scannedData) return;
    
    setScannedData(result);
    setLoading(true);
    setError(null);
    setJustCheckedIn(false);

    try {
      const data = await guestService.getById(result);
      
      if (!data) {
        setError("Código no válido o invitación eliminada.");
      } else if (data.eventId !== clientEvent?.id) {
        setError("Este código QR pertenece a otro evento.");
      } else {
        setGuest(data);
        playSuccessSound();
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al buscar.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!guest?.id) return;
    setLoading(true);
    try {
      await guestService.checkIn(guest.id);
      setGuest(prev => prev ? ({ ...prev, hasArrived: true }) : null);
      setJustCheckedIn(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (err) {
      console.error(err);
      alert("Error al registrar entrada");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setGuest(null);
    setError(null);
    setJustCheckedIn(false);
  };

  const getTableName = (tableId?: string | null) => {
    if (!tableId) return null;
    const table = tables.find(t => t.id === tableId);
    return table ? table.name : "Mesa Eliminada";
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 flex items-center gap-4 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">Modo Hostess</h1>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {!scannedData ? (
           <div className="flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden">
              <Scanner 
                  onScan={(result) => {
                      if (result && result.length > 0) handleScan(result[0].rawValue);
                  }}
                  styles={{ container: { width: "100%", height: "100%" } }}
              />
              <div className="absolute inset-0 border-2 border-white/30 pointer-events-none flex items-center justify-center">
                 <div className="w-64 h-64 border-2 border-primary rounded-lg animate-pulse bg-primary/10"></div>
              </div>
              <p className="absolute bottom-10 text-white/80 bg-black/50 px-4 py-2 rounded-full text-sm z-20">
                Apunta al código QR
              </p>
           </div>
        ) : (
           /* ZONA DE RESULTADOS - Padding reducido para móviles */
           <div className="flex-1 bg-slate-950 p-4 flex flex-col items-center justify-center overflow-y-auto">
              
              {loading && <div className="text-center text-slate-400 animate-pulse">Procesando...</div>}

              {error && (
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                   <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                   <h2 className="text-xl font-bold text-red-400">¡Error!</h2>
                   <p className="text-slate-400 text-sm px-4">{error}</p>
                   <Button onClick={resetScanner} className="w-full mt-4 bg-slate-800">Escanear otro</Button>
                </div>
              )}

              {guest && !loading && !error && (
                <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
                   <CardHeader className={`text-center border-b border-slate-800 pb-4 ${
                       guest.hasArrived && !justCheckedIn ? "bg-yellow-500/10" : justCheckedIn ? "bg-green-500/10" : ""
                   }`}>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-bold">
                        {guest.hasArrived ? "⚠️ YA REGISTRADO" : "ACCESO AUTORIZADO"}
                      </p>
                      <CardTitle className="text-2xl font-bold text-white truncate px-2">
                        {guest.familyName}
                      </CardTitle>
                      <div className="flex justify-center gap-2 mt-2">
                         <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 text-xs font-medium border border-slate-700">
                            <Users className="w-3 h-3 mr-2 text-primary" />
                            {guest.members.length} Personas
                         </span>
                      </div>
                   </CardHeader>

                   <CardContent className="pt-4 space-y-5">
                      
                      {/* --- LISTA OPTIMIZADA (MOBILE FIRST) --- */}
                      <div className="space-y-2">
                         <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-bold text-slate-500 uppercase">Lista de Invitados</p>
                            <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {guest.members.filter(m => m.isConfirmed).length} Confirmados
                            </span>
                         </div>

                         <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-1">
                            {guest.members.map((m, i) => {
                                const tableName = getTableName(m.tableId);
                                
                                // Configuración de estilos
                                let statusStyle = {
                                    bg: "bg-slate-950",
                                    border: "border-slate-800",
                                    iconColor: "text-slate-500",
                                    iconBg: "bg-slate-900",
                                    textColor: "text-slate-300",
                                    subTextColor: "text-slate-500",
                                    Icon: Armchair,
                                    badgeText: "Sin Mesa Asignada",
                                    badgeClass: "text-yellow-600"
                                };

                                if (!m.isConfirmed) {
                                    statusStyle = {
                                        bg: "bg-red-950/10",
                                        border: "border-red-900/20",
                                        iconColor: "text-red-500/70",
                                        iconBg: "bg-red-950/30",
                                        textColor: "text-slate-500 line-through decoration-red-900/50",
                                        subTextColor: "text-red-500/50",
                                        Icon: UserX,
                                        badgeText: "Canceló asistencia",
                                        badgeClass: "text-red-500/70"
                                    };
                                } else if (tableName) {
                                    statusStyle = {
                                        bg: "bg-slate-950",
                                        border: "border-green-900/30 shadow-[inset_0_0_10px_rgba(74,222,128,0.05)]",
                                        iconColor: "text-green-400",
                                        iconBg: "bg-green-950/30",
                                        textColor: "text-white font-medium",
                                        subTextColor: "text-green-400",
                                        Icon: Armchair,
                                        badgeText: tableName,
                                        badgeClass: "text-green-400 font-bold"
                                    };
                                }

                                const StatusIcon = statusStyle.Icon;

                                return (
                                  <div 
                                    key={i} 
                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${statusStyle.bg} ${statusStyle.border}`}
                                  >
                                      {/* Icono fijo a la izquierda */}
                                      <div className={`p-2 rounded-full shrink-0 ${statusStyle.iconBg} ${statusStyle.iconColor}`}>
                                          <StatusIcon className="w-4 h-4" />
                                      </div>

                                      {/* Texto apilado (Stack) para evitar scroll horizontal */}
                                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                                          <p className={`text-sm truncate ${statusStyle.textColor}`}>
                                            {m.name}
                                          </p>
                                          <p className={`text-xs truncate mt-0.5 ${statusStyle.badgeClass}`}>
                                            {statusStyle.badgeText}
                                          </p>
                                      </div>
                                  </div>
                                );
                            })}
                         </div>
                      </div>
                      {/* ---------------------- */}

                      <div className="space-y-3 pt-2">
                        {!justCheckedIn ? (
                            <Button 
                                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 active:scale-[0.98] transition-all"
                                onClick={handleCheckIn}
                                disabled={guest.hasArrived} 
                            >
                                {guest.hasArrived ? "YA REGISTRADO" : "DAR ACCESO"}
                            </Button>
                        ) : (
                            <div className="text-center py-2 animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-2" />
                                <p className="text-lg font-bold text-green-500">¡Bienvenidos!</p>
                            </div>
                        )}

                        <Button variant="ghost" onClick={resetScanner} className="w-full h-12 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-800">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Escanear Siguiente
                        </Button>
                      </div>

                   </CardContent>
                </Card>
              )}
           </div>
        )}
      </div>
    </div>
  );
}