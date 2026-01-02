"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Gift, Landmark, Plus, Trash2, 
  Save, Loader2
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { eventService, GiftRegistry } from "@/services/eventService";
import { useAuthStore } from "@/store/useAuthStore"; // <--- IMPORTAR

export function ClientGiftsPage() {
  const navigate = useNavigate();
  // USAMOS STORE
  const { clientEvent, updateCurrentEvent } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  if (!clientEvent) {
      setTimeout(() => navigate("/login"), 100);
      return null;
  }

  // HELPER: Actualiza el store localmente
  const updateBankAccount = (field: 'bankName' | 'clabe' | 'holder', value: string) => {
      const currentGifts = clientEvent.gifts || {};
      const currentBank = currentGifts.bankAccount || { bankName: "", clabe: "", holder: "" };
      
      updateCurrentEvent({
        gifts: {
          ...currentGifts,
          bankAccount: { ...currentBank, [field]: value }
        }
      });
  };

  const handleAddRegistry = () => {
    const newRegistry: GiftRegistry = { id: crypto.randomUUID(), store: "", url: "" };
    const currentGifts = clientEvent.gifts || {};
    const currentRegistries = currentGifts.registries || [];

    updateCurrentEvent({
      gifts: {
        ...currentGifts,
        registries: [...currentRegistries, newRegistry]
      }
    });
  };

  const handleRemoveRegistry = (id: string) => {
    if (!clientEvent.gifts?.registries) return;
    updateCurrentEvent({
      gifts: {
        ...clientEvent.gifts,
        registries: clientEvent.gifts.registries.filter(r => r.id !== id)
      }
    });
  };

  const updateRegistry = (idx: number, field: 'store' | 'url', value: string) => {
    if (!clientEvent.gifts?.registries) return;
    const newRegs = [...clientEvent.gifts.registries];
    newRegs[idx] = { ...newRegs[idx], [field]: value };
    
    updateCurrentEvent({
      gifts: { ...clientEvent.gifts, registries: newRegs }
    });
  };

  const handleSave = async () => {
    if (!clientEvent.id) return;
    setIsSaving(true);
    try {
      const giftsToSave = {
        bankAccount: {
          bankName: clientEvent.gifts?.bankAccount?.bankName || "",
          clabe: clientEvent.gifts?.bankAccount?.clabe || "",
          holder: clientEvent.gifts?.bankAccount?.holder || "",
        },
        registries: clientEvent.gifts?.registries || [],
        cashInstructions: clientEvent.gifts?.cashInstructions || ""
      };

      await eventService.update(clientEvent.id, { gifts: giftsToSave });
      toast.success("Mesa de regalos actualizada");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

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
                  value={clientEvent.gifts?.bankAccount?.bankName || ""} 
                  onChange={e => updateBankAccount('bankName', e.target.value)}
                  className="bg-slate-950 border-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">CLABE (18 dígitos)</Label>
                <Input 
                  placeholder="0000 0000 0000 0000 00"
                  value={clientEvent.gifts?.bankAccount?.clabe || ""} 
                  onChange={e => updateBankAccount('clabe', e.target.value)}
                  className="bg-slate-950 border-slate-700 font-mono" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Nombre del Titular</Label>
              <Input 
                placeholder="Nombre tal cual aparece en el banco"
                value={clientEvent.gifts?.bankAccount?.holder || ""} 
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
              <Button onClick={handleAddRegistry} variant="outline" size="sm" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                <Plus size={16} className="mr-1" /> Añadir tienda
              </Button>
            </div>
            
            <div className="space-y-4">
              {clientEvent.gifts?.registries?.map((reg, idx) => (
                <div key={reg.id} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-950/40 p-4 rounded-xl border border-slate-800 group relative">
                  <div className="w-full sm:w-1/3 space-y-2">
                    <Label className="text-xs text-slate-500">Tienda / Plataforma</Label>
                    <Input 
                      placeholder="Ej: Amazon..." 
                      value={reg.store} 
                      onChange={e => updateRegistry(idx, 'store', e.target.value)}
                      className="bg-slate-950 border-slate-700" 
                    />
                  </div>
                  <div className="w-full sm:flex-1 space-y-2">
                    <Label className="text-xs text-slate-500">URL</Label>
                    <Input 
                      value={reg.url} 
                      onChange={e => updateRegistry(idx, 'url', e.target.value)}
                      className="bg-slate-950 border-slate-700 text-xs font-mono" 
                    />
                  </div>
                  <Button variant="ghost" onClick={() => handleRemoveRegistry(reg.id)} className="text-slate-600 hover:text-red-400">
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 h-14 font-bold text-lg">
          {isSaving ? <><Loader2 className="animate-spin mr-2" /> Guardando...</> : <><Save className="mr-2 w-5 h-5" /> Guardar Todo</>}
        </Button>
      </div>
    </div>
  );
}