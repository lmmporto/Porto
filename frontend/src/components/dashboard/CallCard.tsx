"use client";

import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, Lock, User } from 'lucide-react';
import type { SDRCall } from '@/types';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/context/DashboardContext';

interface CallCardProps {
  call: SDRCall;
}

export function CallCard({ call }: CallCardProps) {
  const router = useRouter();
  const { user, isAdmin } = useDashboard();

  // 🏛️ ARQUITETO: Lógica de Acesso (Gatekeeper)
  const isOwner = call.ownerEmail?.toLowerCase().trim() === user?.email?.toLowerCase().trim();
  const isElite = Number(call.nota_spin || 0) >= 7;
  const isDone = call.processingStatus === 'DONE';
  
  // Pode acessar se: for Admin OU for o Dono OU for uma chamada nota 7+
  const canAccess = isAdmin || isOwner || isElite;

  const getTheme = () => {
    if (!isDone) return { color: "text-slate-500", label: "PROCESSANDO" };
    if (call.rota === "ROTA_C") return { color: "text-sky-400", label: "ROTA C" };
    
    const score = call.nota_spin || 0;
    if (score >= 8) return { color: "text-emerald-400", label: "NOTA SPIN" };
    if (score >= 5) return { color: "text-amber-400", label: "NOTA SPIN" };
    return { color: "text-rose-400", label: "NOTA SPIN" };
  };

  const theme = getTheme();

  const handleNavigation = () => {
    if (canAccess) {
      router.push(`/dashboard/calls/${call.id}`);
    }
  };

  return (
    <div 
      onClick={handleNavigation}
      className={cn(
        "bg-slate-900/50 border transition-all rounded-2xl p-5 group",
        canAccess 
          ? "border-slate-800 hover:border-indigo-500/50 cursor-pointer" 
          : "border-slate-800/40 opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn(
            "p-3 rounded-xl transition-colors shrink-0",
            canAccess ? "bg-slate-800 text-slate-400 group-hover:text-indigo-400" : "bg-slate-900 text-slate-600"
          )}>
            {canAccess ? <Phone className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight truncate">
              {call.title || 'Cliente Externo'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-slate-500 font-medium">
                {call.ownerName} • {new Date(call.callTimestamp || Date.now()).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {theme.label}
            </p>
            <p className={cn("text-xl font-black", theme.color)}>
              {isDone ? call.nota_spin?.toFixed(1) : '--'}
            </p>
          </div>
          
          {canAccess ? (
            <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
          ) : (
            <div className="w-5 h-5" /> // Espaçador para manter o alinhamento
          )}
        </div>
      </div>

      {/* Tooltip de aviso para chamadas bloqueadas */}
      {!canAccess && (
        <p className="mt-3 text-[9px] text-slate-600 italic border-t border-slate-800/50 pt-2">
          Acesso restrito. Apenas chamadas nota 7+ de colegas são abertas para estudo.
        </p>
      )}
    </div>
  );
}