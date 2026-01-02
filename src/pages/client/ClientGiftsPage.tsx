"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Gift, Landmark, Plus, Trash2, 
  Save, Loader2,Info 
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService, EventData, GiftRegistry } from "@/services/eventService";

export function ClientGiftsPage() {
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const eventId = localStorage.getItem("clientEventId");

  useEffect(() => {
    if (!eventId) {
      navigate("/login");
      return;
    }
    const fetchEvent = async () => {
      const data = await eventService.getById(eventId);
      if (data) setEvent(data);
      setLoading(false);
    };
    fetchEvent();
  }, [eventId, navigate]);

  // HELPER: Actualización segura de la cuenta bancaria sin Non-Null Assertions (!)
  const updateBankAccount = (field: 'bankName' | 'clabe' | 'holder', value: string) => {
    setEvent(prev => {
      if (!prev) return null;
      const currentGifts = prev.gifts || {};
      const currentBank = currentGifts.bankAccount || { bankName: "", clabe: "", holder: "" };

      return {
        ...prev,
        gifts: {
          ...currentGifts,
          bankAccount: {
            ...currentBank,
            [field]: value
          }
        }
      };
    });
  };

  const handleAddRegistry = () => {
    setEvent(prev => {
      if (!prev) return null;
      const newRegistry: GiftRegistry = { id: crypto.randomUUID(), store: "", url: "" };
      const currentGifts = prev.gifts || {};
      const currentRegistries = currentGifts.registries || [];
      
      return {
        ...prev,
        gifts: {
          ...currentGifts,
          registries: [...currentRegistries, newRegistry]
        }
      };
    });
  };

  const handleRemoveRegistry = (id: string) => {
    setEvent(prev => {
      if (!prev || !prev.gifts?.registries) return prev;
      return {
        ...prev,
        gifts: {
          ...prev.gifts,
          registries: prev.gifts.registries.filter(r => r.id !== id)
        }
      };
    });
  };

  const updateRegistry = (idx: number, field: 'store' | 'url', value: string) => {
    setEvent(prev => {
      if (!prev || !prev.gifts?.registries) return prev;
      const newRegs = [...prev.gifts.registries];
      newRegs[idx] = { ...newRegs[idx], [field]: value };
      return {
        ...prev,
        gifts: { ...prev.gifts, registries: newRegs }
      };
    });
  };

  const handleSave = async () => {
    if (!event?.id) return;
    setIsSaving(true);
    try {
      // SANITIZACIÓN: Limpiamos undefined antes de enviar a Firebase
      const giftsToSave = {
        bankAccount: {
          bankName: event.gifts?.bankAccount?.bankName || "",
          clabe: event.gifts?.bankAccount?.clabe || "",
          holder: event.gifts?.bankAccount?.holder || "",
        },
        registries: event.gifts?.registries || [],
        cashInstructions: event.gifts?.cashInstructions || ""
      };

      await eventService.update(event.id, { gifts: giftsToSave });
      alert("🎁 Datos de regalos actualizados correctamente.");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <Loader2 className="animate-spin mr-2" /> Cargando configuración de regalos...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-bold">Mesa de Regalos</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Opciones para tus invitados</p>
          </div>
        </div>

        {/* TRANSFERENCIA BANCARIA */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-blue-400 border-b border-slate-800 pb-4">
              <Landmark size={20} />
              <h2 className="font-semibold uppercase tracking-wider text-sm">Transferencia Bancaria</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-400">Banco</Label>
                <Input 
                  placeholder="Ej: BBVA, Santander..."
                  value={event?.gifts?.bankAccount?.bankName || ""} 
                  onChange={e => updateBankAccount('bankName', e.target.value)}
                  className="bg-slate-950 border-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">CLABE (18 dígitos)</Label>
                <Input 
                  placeholder="0000 0000 0000 0000 00"
                  value={event?.gifts?.bankAccount?.clabe || ""} 
                  onChange={e => updateBankAccount('clabe', e.target.value)}
                  className="bg-slate-950 border-slate-700 font-mono" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Nombre del Titular</Label>
              <Input 
                placeholder="Nombre tal cual aparece en el banco"
                value={event?.gifts?.bankAccount?.holder || ""} 
                onChange={e => updateBankAccount('holder', e.target.value)}
                className="bg-slate-950 border-slate-700" 
              />
            </div>
          </CardContent>
        </Card>

        {/* MESAS EXTERNAS */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Gift size={20} />
                <h2 className="font-semibold uppercase tracking-wider text-sm">Links Externos</h2>
              </div>
              <Button 
                onClick={handleAddRegistry} 
                variant="outline" 
                size="sm" 
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                <Plus size={16} className="mr-1" /> Añadir tienda
              </Button>
            </div>
            
            <div className="space-y-4">
              {event?.gifts?.registries?.map((reg, idx) => (
                <div key={reg.id} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-950/40 p-4 rounded-xl border border-slate-800 group relative">
                  <div className="w-full sm:w-1/3 space-y-2">
                    <Label className="text-xs text-slate-500">Tienda / Plataforma</Label>
                    <Input 
                      placeholder="Ej: Amazon, Liverpool..." 
                      value={reg.store} 
                      onChange={e => updateRegistry(idx, 'store', e.target.value)}
                      className="bg-slate-950 border-slate-700" 
                    />
                  </div>
                  <div className="w-full sm:flex-1 space-y-2">
                    <Label className="text-xs text-slate-500">URL de la mesa</Label>
                    <Input 
                      placeholder="https://www.tienda.com/mesa/tu-boda" 
                      value={reg.url} 
                      onChange={e => updateRegistry(idx, 'url', e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs font-mono" 
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleRemoveRegistry(reg.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}

              {(!event?.gifts?.registries || event.gifts.registries.length === 0) && (
                <div className="text-center py-8 text-slate-600 italic text-sm">
                  No has añadido mesas de regalos externas.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips UX */}
        <div className="flex gap-3 bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <b>Tip Pro:</b> En la invitación, los invitados verán un botón de "Copiar" junto a tu CLABE para que no tengan que escribir los 18 dígitos manualmente en su app bancaria.
          </p>
        </div>

        {/* Acciones */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-full bg-blue-600 hover:bg-blue-500 h-14 font-bold text-lg shadow-lg shadow-blue-900/20"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 w-5 h-5" /> Guardar Todo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}