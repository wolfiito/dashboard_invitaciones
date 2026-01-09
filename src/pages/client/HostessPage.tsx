// src/pages/client/HostessPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ArrowLeft, CheckCircle2, XCircle, Users, RefreshCw } from "lucide-react";
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

  // 1. Cargar mesas para tener los nombres listos
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
                      
                      {/* --- AQUÍ ESTÁ EL CAMBIO SOLICITADO --- */}
                      <div className="space-y-3">
                         <p className="text-xs font-bold text-slate-500 uppercase">Distribución de Mesas</p>
                         <div className="grid gap-2 max-h-60 overflow-y-auto">
                            {guest.members.map((m, i) => {
                                const tableName = getTableName(m.tableId);
                                
                                return (
                                  <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                                      {/* Nombre del invitado (Tachado si canceló) */}
                                      <span className={`font-medium ${!m.isConfirmed ? "text-slate-500 line-through decoration-slate-600" : "text-slate-200"}`}>
                                        {m.name}
                                      </span>

                                      {/* Lógica de Etiquetas (Badges) */}
                                      {!m.isConfirmed ? (
                                          // CASO 1: CANCELÓ
                                          <span className="text-red-500 font-bold text-xs bg-red-950/30 px-2 py-1 rounded border border-red-900/50 uppercase tracking-wider">
                                            Canceló
                                          </span>
                                      ) : tableName ? (
                                          // CASO 2: TIENE MESA
                                          <span className="text-green-400 font-bold text-sm bg-green-900/20 px-2 py-1 rounded border border-green-900/50">
                                            {tableName}
                                          </span>
                                      ) : (
                                          // CASO 3: SIN MESA
                                          <span className="text-yellow-500/70 text-xs italic bg-yellow-900/10 px-2 py-1 rounded">
                                            Sin Mesa
                                          </span>
                                      )}
                                  </div>
                                );
                            })}
                         </div>
                      </div>
                      {/* -------------------------------------- */}

                      {!justCheckedIn ? (
                          <Button 
                            className="w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-[1.02]"
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

                      <Button variant="outline" onClick={resetScanner} className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
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