import React from "react";
import { cn } from "@/lib/utils";

// 1. El Contenedor Principal
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-slate-700 rounded-xl shadow-sm text-text overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// 2. El Encabezado de la Tarjeta (Opcional)
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-4 border-b border-slate-700/50", className)} {...props}>
      {children}
    </div>
  );
}

// 3. El Título de la Tarjeta
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-text leading-none tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
}

// 4. El Cuerpo de la Tarjeta
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}