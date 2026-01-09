import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { guestService, GuestData } from "@/services/guestService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Quote, CalendarDays, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ClientMessagesPage() {
  const { clientEvent } = useAuthStore();
  const [messages, setMessages] = useState<GuestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientEvent?.id) return;

    // Nos suscribimos a los cambios en tiempo real
    const unsubscribe = guestService.subscribeByEvent(clientEvent.id, (guests) => {
      // Filtramos solo los que tienen un mensaje escrito
      const withMessages = guests.filter(
        (g) => g.message && g.message.trim().length > 0
      );
      setMessages(withMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientEvent?.id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-pink-500/10 rounded-full">
            <Heart className="w-8 h-8 text-pink-500" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Libro de Deseos</h1>
            <p className="text-slate-400">Mensajes de cariño dejados por tus invitados.</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
          <Quote className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-300">Aún no hay mensajes</h3>
          <p className="text-slate-500 mt-2">Los mensajes aparecerán aquí cuando los invitados confirmen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messages.map((guest) => (
            <Card key={guest.id} className="bg-slate-900 border-slate-800 overflow-hidden hover:border-pink-500/30 transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-500 opacity-80" />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        {guest.familyName}
                    </CardTitle>
                    {guest.status === 'confirmed' ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                            Asistirá
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                            No Asistirá
                        </Badge>
                    )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Familia / Invitados
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                    <Quote className="absolute -top-1 -left-1 w-6 h-6 text-slate-800 transform -scale-x-100" />
                    <p className="text-slate-300 italic pl-6 text-sm leading-relaxed">
                        "{guest.message}"
                    </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}