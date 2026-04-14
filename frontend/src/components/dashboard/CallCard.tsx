"use client";

import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';
import type { SDRCall } from '@/types';
import { cn } from '@/lib/utils';

interface CallCardProps {
  call: SDRCall;
}

export function CallCard({ call }: CallCardProps) {
  // 🏛️ ARQUITETO: Lógica de Processamento e Identificação de Rota
  const isDone = call.processingStatus === 'DONE';
  const isRotaC = call.rota === "ROTA_C" || call.status_final === "NAO_SE_APLICA";
  
  // 🏛️ ARQUITETO: displayScore agora é mais honesto com o estado da ligação
  const displayScore = isDone && typeof call.nota_spin === 'number' ? call.nota_spin.toFixed(1) : '--';

  // 🚩 SISTEMA DE CORES E LABELS ATUALIZADO
  const getTheme = () => {
    if (!isDone) return { color: "text-slate-500", label: "PROCESSANDO" };
    if (isRotaC) return { color: "text-sky-400", label: "ROTA C" };
    
    const score = call.nota_spin || 0;
    if (score >= 8) return { color: "text-emerald-400", label: "NOTA SPIN" };
    if (score >= 5) return { color: "text-amber-400", label: "NOTA SPIN" };
    return { color: "text-rose-400", label: "NOTA SPIN" };
  };

  const theme = getTheme();

  const formatSimpleDate = (dateInput: any) => {
    if (!dateInput) return '--/--';
    const seconds = dateInput?._seconds || dateInput?.seconds || (typeof dateInput === 'number' ? dateInput : null);
    try {
      const date = seconds ? new Date(seconds * 1000) : new Date(dateInput);
      if (isNaN(date.getTime())) return '--/--';
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
    } catch {
      return '--/--';
    }
  };

  return (
    <Link href={`/dashboard/calls/${call.id}`}>
      <div className="bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all rounded-2xl p-5 group cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-800 rounded-xl text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight truncate">
                {call.title || 'Cliente Externo'}
              </h3>
              {/* 🏛️ ARQUITETO: Prioridade para a data real da ligação */}
              <p className="text-[10px] text-slate-500 font-medium">
                {formatSimpleDate(call.callTimestamp || call.updatedAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                {theme.label}
              </p>
              <p className={cn("text-xl font-black", theme.color)}>
                {displayScore}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}