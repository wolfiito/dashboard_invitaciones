import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventService } from "@/services/eventService";

export function ClientLoginPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Validamos el token en Firebase
      const event = await eventService.loginWithToken(token.trim());
      
      // 2. Si es válido, guardamos el ID en el navegador
      if (event.id) {
        localStorage.setItem("clientEventId", event.id);
        // 3. Redirigimos al Dashboard del Cliente
        navigate("/client/dashboard");
      }
      
    } catch (err) {
      // CORRECCIÓN: Tipado seguro de errores
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Código incorrecto o error desconocido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Logo o Branding */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary tracking-tight">
            Event<span className="text-white">OS</span>
          </h1>
          <p className="mt-2 text-secondary">
            Bienvenido. Ingresa tu código de acceso para gestionar tu evento.
          </p>
        </div>

        <Card className="border-slate-700/50 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-center text-lg">Acceso a Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-secondary" />
                  <Input 
                    placeholder="Pega tu código aquí..." 
                    className="pl-9 h-12 text-lg bg-surface border-slate-700"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 font-medium animate-in fade-in">
                    {error}
                  </p>
                )}
              </div>

              <Button className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <>
                    Ingresar al Evento
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-secondary/50">
          ¿No tienes tu código? Contacta a tu organizador.
        </p>
      </div>
    </div>
  );
}