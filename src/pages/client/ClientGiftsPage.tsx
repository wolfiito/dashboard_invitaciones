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
import { useAuthStore } from "@/store/useAuthStore";

export function ClientGiftsPage() {
  const navigate = useNavigate();
  const { clientEvent, updateCurrentEvent } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  if (!clientEvent) {
      setTimeout(() => navigate("/login"), 100);
      return null;
  }

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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-black text-foreground">Mesa de Regalos</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Opciones para tus invitados</p>
          </div>
        </div>

        {/* TRANSFERENCIA BANCARIA - ESTILO TARJETA PREMIUM */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none" />
          
          <CardContent className="p-8 space-y-6 relative z-10">
            <div className="flex items-center gap-2 text-blue-200 border-b border-white/10 pb-4">
              <Landmark size={20} />
              <h2 className="font-bold uppercase tracking-wider text-sm">Transferencia Bancaria</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white/60 text-xs font-bold uppercase">Banco</Label>
                <Input 
                  placeholder="Ej: BBVA"
                  value={clientEvent.gifts?.bankAccount?.bankName || ""} 
                  onChange={e => updateBankAccount('bankName', e.target.value)}
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/20 focus:bg-white/20 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs font-bold uppercase">CLABE (18 dígitos)</Label>
                <Input 
                  placeholder="0000 0000 0000 0000 00"
                  value={clientEvent.gifts?.bankAccount?.clabe || ""} 
                  onChange={e => updateBankAccount('clabe', e.target.value)}
                  className="bg-white/10 border-white/10 text-white font-mono tracking-widest placeholder:text-white/20 focus:bg-white/20 transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60 text-xs font-bold uppercase">Nombre del Titular</Label>
              <Input 
                placeholder="Nombre tal cual aparece en el banco"
                value={clientEvent.gifts?.bankAccount?.holder || ""} 
                onChange={e => updateBankAccount('holder', e.target.value)}
                className="bg-white/10 border-white/10 text-white placeholder:text-white/20 focus:bg-white/20 transition-all" 
              />
            </div>
          </CardContent>
        </Card>

        {/* MESAS EXTERNAS */}
        <Card className="bg-white border-border shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Gift size={20} />
                <h2 className="font-black uppercase tracking-wider text-sm">Links Externos</h2>
              </div>
              <Button onClick={handleAddRegistry} variant="outline" size="sm" className="border-dashed border-primary/50 text-primary hover:bg-primary/5">
                <Plus size={16} className="mr-1" /> Añadir tienda
              </Button>
            </div>
            
            <div className="space-y-4">
              {clientEvent.gifts?.registries?.map((reg, idx) => (
                <div key={reg.id} className="flex flex-col sm:flex-row gap-4 items-end bg-secondary/30 p-4 rounded-xl border border-border group relative transition-all hover:border-primary/30">
                  <div className="w-full sm:w-1/3 space-y-2">
                    <Label className="text-xs text-muted-foreground font-bold">Tienda / Plataforma</Label>
                    <Input 
                      placeholder="Ej: Amazon..." 
                      value={reg.store} 
                      onChange={e => updateRegistry(idx, 'store', e.target.value)}
                      className="bg-white border-input" 
                    />
                  </div>
                  <div className="w-full sm:flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground font-bold">URL</Label>
                    <Input 
                      value={reg.url} 
                      onChange={e => updateRegistry(idx, 'url', e.target.value)}
                      className="bg-white border-input text-xs font-mono text-primary" 
                    />
                  </div>
                  <Button variant="ghost" onClick={() => handleRemoveRegistry(reg.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
              
              {(!clientEvent.gifts?.registries || clientEvent.gifts.registries.length === 0) && (
                 <p className="text-center text-sm text-muted-foreground py-4 italic">No has agregado mesas de regalo externas.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={isSaving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-bold text-lg rounded-xl shadow-lg shadow-primary/20">
          {isSaving ? <><Loader2 className="animate-spin mr-2" /> Guardando...</> : <><Save className="mr-2 w-5 h-5" /> Guardar Todo</>}
        </Button>
      </div>
    </div>
  );
}