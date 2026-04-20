import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Transforma um e-mail no formato de ID do Firestore (underscores)
 * Ordem: Decode -> Lowercase -> Replace dots
 * Ex: amaranta.vieira@nibo.com.br -> amaranta_vieira@nibo_com_br
 */
export function formatEmailToSdrId(email: string): string {
  if (!email) return '';
  
  // 1. Transforma %40 em @ e outros caracteres de URL
  const decoded = decodeURIComponent(email);
  
  // 2. Garante que não haja erro de caixa alta
  const lowered = decoded.toLowerCase();
  
  // 3. Transforma todos os pontos em underscores
  return lowered.replace(/\./g, '_');
}
