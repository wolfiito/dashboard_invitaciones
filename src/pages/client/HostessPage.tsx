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
  UserX,        // Nuevo
  AlertCircle,  // Nuevo
  Armchair      // Nuevo (Sillón para representar mesa)
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
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      
      <div className="p-4 flex items-center gap-4 bg-slate-900 border-b border-slate-800">
        <Button variant="ghost" size="sm" onClick={() => navigate("/client/dashboard")} className="text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">Modo Hostess</h1>
      </div>

      <div className="flex-1 flex flex-col relative">
        
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
              <p className="absolute bottom-10 text-white/80 bg-black/50 px-4 py-2 rounded-full text-sm">
                Apunta al código QR
              </p>
           </div>
        ) : (
           <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center animate-in slide-in-from-bottom-10">
              
              {loading && <div className="text-center">Procesando...</div>}

              {error && (
                <div className="text-center space-y-4">
                   <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                   <h2 className="text-2xl font-bold text-red-400">¡Error!</h2>
                   <p className="text-slate-400">{error}</p>
                   <Button onClick={resetScanner} className="w-full mt-8 bg-slate-800">Escanear otro</Button>
                </div>
              )}

              {guest && !loading && !error && (
                <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
                   <CardHeader className={`text-center border-b border-slate-800 pb-6 ${
                       guest.hasArrived && !justCheckedIn ? "bg-yellow-500/10" : justCheckedIn ? "bg-green-500/10" : ""
                   }`}>
                      <p className="text-sm text-slate-400 uppercase tracking-widest mb-2 font-bold">
                        {guest.hasArrived ? "⚠️ YA REGISTRADO" : "ACCESO AUTORIZADO"}
                      </p>
                      <CardTitle className="text-3xl font-bold text-white">{guest.familyName}</CardTitle>
                      <div className="flex justify-center gap-2 mt-2">
                         <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 text-sm">
                            <Users className="w-4 h-4 mr-2 text-primary" />
                            {guest.members.length} Personas
                         </span>
                      </div>
                   </CardHeader>

                   <CardContent className="pt-6 space-y-6">
                      
                      {/* --- LISTA MEJORADA --- */}
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-500 uppercase">Distribución de Mesas</p>
                            <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {guest.members.filter(m => m.isConfirmed).length} Confirmados
                            </span>
                         </div>

                         <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                            {guest.members.map((m, i) => {
                                const tableName = getTableName(m.tableId);
                                
                                // Configuración dinámica de estilos según estado
                                let statusStyle = {
                                    bg: "bg-slate-900/50",
                                    border: "border-slate-800",
                                    iconColor: "text-slate-500",
                                    textColor: "text-slate-300",
                                    Icon: Armchair,
                                    badge: "Sin Mesa",
                                    badgeColor: "text-slate-500 bg-slate-800"
                                };

                                if (!m.isConfirmed) {
                                    statusStyle = {
                                        bg: "bg-red-950/10",
                                        border: "border-red-900/20",
                                        iconColor: "text-red-500/50",
                                        textColor: "text-slate-500 line-through decoration-red-900/50",
                                        Icon: UserX,
                                        badge: "Canceló",
                                        badgeColor: "text-red-400 bg-red-950/30 border-red-900/50"
                                    };
                                } else if (tableName) {
                                    statusStyle = {
                                        bg: "bg-green-950/20",
                                        border: "border-green-900/30",
                                        iconColor: "text-green-400",
                                        textColor: "text-white font-medium",
                                        Icon: Armchair,
                                        badge: tableName,
                                        badgeColor: "text-green-400 bg-green-900/20 border-green-900/50 font-bold shadow-[0_0_10px_rgba(74,222,128,0.1)]"
                                    };
                                } else {
                                    statusStyle = {
                                        bg: "bg-yellow-950/10",
                                        border: "border-yellow-900/30",
                                        iconColor: "text-yellow-500",
                                        textColor: "text-slate-200",
                                        Icon: AlertCircle,
                                        badge: "Sin Mesa",
                                        badgeColor: "text-yellow-500 bg-yellow-900/20 border-yellow-900/50"
                                    };
                                }

                                const StatusIcon = statusStyle.Icon;

                                return (
                                  <div 
                                    key={i} 
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${statusStyle.bg} ${statusStyle.border}`}
                                  >
                                      {/* Icono a la izquierda */}
                                      <div className={`p-2 rounded-full bg-black/20 ${statusStyle.iconColor}`}>
                                          <StatusIcon className="w-4 h-4" />
                                      </div>

                                      {/* Nombre */}
                                      <div className="flex-1 min-w-0">
                                          <p className={`text-sm truncate ${statusStyle.textColor}`}>
                                            {m.name}
                                          </p>
                                      </div>

                                      {/* Badge de estado a la derecha */}
                                      <div className={`px-2.5 py-1 rounded text-xs border ${statusStyle.badgeColor} whitespace-nowrap`}>
                                          {statusStyle.badge}
                                      </div>
                                  </div>
                                );
                            })}
                         </div>
                      </div>
                      {/* ---------------------- */}

                      {!justCheckedIn ? (
                          <Button 
                            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            onClick={handleCheckIn}
                            disabled={guest.hasArrived} 
                          >
                             {guest.hasArrived ? "YA INGRESÓ ANTES" : "DAR ACCESO"}
                          </Button>
                      ) : (
                          <div className="text-center py-2 animate-in zoom-in duration-300">
                             <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-2" />
                             <p className="text-xl font-bold text-green-500">¡Bienvenidos!</p>
                          </div>
                      )}

                      <Button variant="ghost" onClick={resetScanner} className="w-full text-slate-500 hover:text-white hover:bg-slate-900">
                         <RefreshCw className="w-4 h-4 mr-2" />
                         Escanear Siguiente
                      </Button>

                   </CardContent>
                </Card>
              )}
           </div>
        )}
      </div>
    </div>
  );
}