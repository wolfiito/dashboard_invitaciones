import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, CalendarCheck } from "lucide-react";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header local de la página */}
      <div className="flex items-center justify-between">
        <div>
          {/* Usamos text-foreground para el color principal de texto */}
          <h2 className="text-3xl font-bold text-foreground">Resumen</h2>
          {/* Usamos text-muted-foreground para textos secundarios/grises */}
          <p className="text-muted-foreground mt-1">Lo que está pasando hoy en tus eventos.</p>
        </div>
        
        {/* CORRECCIÓN: variant="primary" -> variant="default" */}
        <Button variant="default"> 
          <Plus className="w-4 h-4 mr-2" />
          Acción Rápida
        </Button>
      </div>

      {/* Grid de Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Eventos</CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">+2 este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invitados</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2,350</div>
            <p className="text-xs text-muted-foreground mt-1">+180 nuevos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}