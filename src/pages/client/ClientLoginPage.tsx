import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ArrowRight, Loader2, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventService } from "@/services/eventService";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export function ClientLoginPage() {
  const navigate = useNavigate();
  
  // CORRECCIÓN: Usamos 'setClientAuth' que es el nombre real en tu store
  const { setClientAuth } = useAuthStore(); 
  
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    
    setIsLoading(true);

    try {
      // 1. Validamos token en Firebase
      const event = await eventService.loginWithToken(token.trim());
      
      if (event && event.id) {
        // 2. Guardamos en el Store usando la función correcta
        setClientAuth(event);
        
        // 3. Feedback y Redirección
        toast.success(`¡Bienvenido a ${event.name}!`);
        navigate("/client/dashboard");
      } else {
        toast.error("Código inválido. Verifica e intenta de nuevo.");
      }
      
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión o código incorrecto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo (burbujas pastel) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Branding Amigable */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4 text-primary">
             <HeartHandshake size={32} />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Tu Evento
          </h1>
          <p className="text-muted-foreground font-medium">
            Ingresa tu código de invitado para gestionar tu boda o evento.
          </p>
        </div>

        <Card className="border-border bg-white/80 backdrop-blur-xl shadow-2xl shadow-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-lg font-bold text-foreground">Acceso Privado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-2">
                <div className="relative group">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Ej: ABC-123-XYZ" 
                    className="pl-10 h-14 text-lg bg-white border-input focus:ring-2 focus:ring-primary/20 transition-all text-center font-mono tracking-widest uppercase text-foreground placeholder:text-muted-foreground/50"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Validando...
                  </>
                ) : (
                  <>
                    Ingresar ahora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-medium px-8">
          ¿Problemas para entrar? Contacta a tu proveedor.
        </p>
      </div>
    </div>
  );
}