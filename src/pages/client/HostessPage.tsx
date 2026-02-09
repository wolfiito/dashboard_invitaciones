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
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 flex items-center gap-4 bg-white border-b border-border z-10 shrink-0 shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-muted-foreground hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Modo Hostess</h1>
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
                 <div className="w-64 h-64 border-2 border-primary rounded-lg animate-pulse bg-primary/20"></div>
              </div>
              <p className="absolute bottom-10 text-white font-medium bg-black/60 backdrop-blur-md px-6 py-3 rounded-full text-sm z-20 shadow-lg">
                Apunta al código QR
              </p>
           </div>
        ) : (
           /* ZONA DE RESULTADOS - ADAPTADA A TEMA CLARO */
           <div className="flex-1 bg-background p-4 flex flex-col items-center justify-center overflow-y-auto">
              
              {loading && <div className="text-center text-muted-foreground animate-pulse font-medium">Procesando...</div>}

              {error && (
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300 bg-white p-8 rounded-3xl shadow-xl border border-border">
                   <XCircle className="w-16 h-16 text-destructive mx-auto" />
                   <h2 className="text-xl font-bold text-destructive">¡Error!</h2>
                   <p className="text-muted-foreground text-sm px-4">{error}</p>
                   <Button onClick={resetScanner} className="w-full mt-4" variant="outline">Escanear otro</Button>
                </div>
              )}

              {guest && !loading && !error && (
                <Card className="w-full max-w-md bg-white border-border text-foreground shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
                   <CardHeader className={cn("text-center border-b border-border pb-4", 
                       guest.hasArrived && !justCheckedIn ? "bg-yellow-50" : justCheckedIn ? "bg-green-50" : "bg-white"
                   )}>
                      <p className={cn("text-xs uppercase tracking-widest mb-1 font-bold",
                          guest.hasArrived && !justCheckedIn ? "text-yellow-600" : justCheckedIn ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {guest.hasArrived ? "⚠️ YA REGISTRADO" : "ACCESO AUTORIZADO"}
                      </p>
                      <CardTitle className="text-2xl font-black text-foreground truncate px-2">
                        {guest.familyName}
                      </CardTitle>
                      <div className="flex justify-center gap-2 mt-2">
                         <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold border border-border">
                            <Users className="w-3 h-3 mr-2 text-primary" />
                            {guest.members.length} Personas
                         </span>
                      </div>
                   </CardHeader>

                   <CardContent className="pt-4 space-y-5">
                      
                      {/* --- LISTA OPTIMIZADA --- */}
                      <div className="space-y-2">
                         <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Lista de Invitados</p>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                {guest.members.filter(m => m.isConfirmed).length} Confirmados
                            </span>
                         </div>

                         <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-1">
                            {guest.members.map((m, i) => {
                                const tableName = getTableName(m.tableId);
                                
                                // Configuración de estilos para TEMA CLARO
                                let statusStyle = {
                                    bg: "bg-white",
                                    border: "border-border",
                                    iconColor: "text-muted-foreground",
                                    iconBg: "bg-secondary",
                                    textColor: "text-foreground font-medium",
                                    subTextColor: "text-muted-foreground",
                                    Icon: Armchair,
                                    badgeText: "Sin Mesa Asignada",
                                    badgeClass: "text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded"
                                };

                                if (!m.isConfirmed) {
                                    statusStyle = {
                                        bg: "bg-red-50",
                                        border: "border-red-100",
                                        iconColor: "text-red-400",
                                        iconBg: "bg-red-100",
                                        textColor: "text-muted-foreground line-through decoration-red-300",
                                        subTextColor: "text-red-400",
                                        Icon: UserX,
                                        badgeText: "Canceló asistencia",
                                        badgeClass: "text-red-500 font-bold"
                                    };
                                } else if (tableName) {
                                    statusStyle = {
                                        bg: "bg-green-50/50",
                                        border: "border-green-200 shadow-sm",
                                        iconColor: "text-green-600",
                                        iconBg: "bg-green-100",
                                        textColor: "text-foreground font-bold",
                                        subTextColor: "text-green-600",
                                        Icon: Armchair,
                                        badgeText: tableName,
                                        badgeClass: "text-green-700 font-black bg-green-100 px-2 py-0.5 rounded border border-green-200"
                                    };
                                }

                                const StatusIcon = statusStyle.Icon;

                                return (
                                  <div 
                                    key={i} 
                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${statusStyle.bg} ${statusStyle.border}`}
                                  >
                                      <div className={`p-2 rounded-full shrink-0 ${statusStyle.iconBg} ${statusStyle.iconColor}`}>
                                          <StatusIcon className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                                          <p className={`text-sm truncate ${statusStyle.textColor}`}>
                                            {m.name}
                                          </p>
                                          <p className={`text-xs truncate mt-1 w-fit ${statusStyle.badgeClass}`}>
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
                                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98] transition-all rounded-xl"
                                onClick={handleCheckIn}
                                disabled={guest.hasArrived} 
                            >
                                {guest.hasArrived ? "YA REGISTRADO" : "DAR ACCESO"}
                            </Button>
                        ) : (
                            <div className="text-center py-2 animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-2" />
                                <p className="text-lg font-bold text-green-600">¡Bienvenidos!</p>
                            </div>
                        )}

                        <Button variant="outline" onClick={resetScanner} className="w-full h-12 border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border rounded-xl">
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