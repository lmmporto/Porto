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
 * Ex: amaranta.vieira@nibo.com.br -> amaranta_vieira@nibo_com_br
 */
export const formatEmailToSdrId = (email: string) => {
  if (!email) return '';
  const decoded = decodeURIComponent(email);
  return decoded.toLowerCase().trim().replace(/\./g, '_');
};
