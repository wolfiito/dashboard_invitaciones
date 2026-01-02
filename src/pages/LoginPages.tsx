// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app"; // <--- CAMBIO AQUÍ: Importado de firebase/app
import { auth } from "@/config/firebase";
import { eventService } from "@/services/eventService";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Ticket } from "lucide-react";

export function LoginPage() {
  const [identifier, setIdentifier] = useState<string>(""); 
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { setAdminAuth, setClientAuth } = useAuthStore();

  const isEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isEmail(identifier)) {
        // LOGIN COMO ADMIN
        const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
        setAdminAuth(userCredential.user);
        navigate("/");
      } else {
        // LOGIN COMO CLIENTE (TOKEN)
        const event = await eventService.loginWithToken(identifier);
        if (event) {
          setClientAuth(event);
          navigate("/client/dashboard");
        } else {
          setError("No se encontró el evento.");
        }
      }
    } catch (err) {
      // Manejo de errores tipado con FirebaseError correctamente importado
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            setError("Credenciales de administrador incorrectas.");
            break;
          case 'auth/too-many-requests':
            setError("Demasiados intentos. Inténtalo más tarde.");
            break;
          default:
            setError(`Error: ${err.code}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              {isEmail(identifier) ? (
                <ShieldCheck className="text-primary w-6 h-6" />
              ) : (
                <Ticket className="text-primary w-6 h-6" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isEmail(identifier) ? "Acceso Administrativo" : "Acceso al Evento"}
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Ingresa tu {isEmail(identifier) ? "correo" : "token de acceso"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id" className="text-slate-200">Correo o Token</Label>
              <Input 
                id="id" 
                placeholder="admin@ejemplo.com o TOKEN-123" 
                value={identifier}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {isEmail(identifier) && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="pass" className="text-slate-200">Contraseña</Label>
                <Input 
                  id="pass" 
                  type="password" 
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-red-400 text-xs text-center font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Entrar al Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}