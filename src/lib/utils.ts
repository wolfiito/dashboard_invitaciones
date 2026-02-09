import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Esta función nos permite combinar clases de tailwind condicionalmente de forma segura
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}