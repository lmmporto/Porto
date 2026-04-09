"use client";

import Link from 'next/link';
import { ChevronRight, Clock, Database, Radio, Hourglass, MinusCircle, Phone, ArrowRight } from 'lucide-react';
import type { SDRCall } from '@/types';
import { cn } from '@/lib/utils';

interface CallCardProps {
  call: SDRCall;
}

export function CallCard({ call }: CallCardProps) {
  // 🚩 LÓGICA DE PROCESSAMENTO E SCORE
  const isDone = call.processingStatus === 'DONE';
  const isRotaC = call.status_final === "NAO_SE_APLICA";
  const isSkipped = call.processingStatus === "SKIPPED_FOR_AUDIT" || call.processingStatus === "SKIPPED_SHORT_CALL";
  
  const displayScore = isDone && !isRotaC ? Number(call.nota_spin || 0).toFixed(1) : '--';
  
  const statusText = isRotaC 
    ? 'ROTA C' 
    : isSkipped 
      ? 'TENTATIVA' 
      : isDone 
        ? 'NOTA SPIN' 
        : 'PROCESSANDO';

  // 🚩 SISTEMA DE CORES ATUALIZADO
  const getTheme = () => {
    if (!isDone || isRotaC || isSkipped) return { bg: "bg-slate-200", text: "text-slate-400" };
    const score = Number(call.nota_spin || 0);
    if (score >= 8) return { bg: "bg-emerald-500", text: "text-emerald-600" }; // Verde
    if (score >= 5) return { bg: "bg-sky-300", text: "text-sky-500" };      // Azul Bebê
    return { bg: "bg-rose-500", text: "text-rose-600" };                   // Vermelho
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

  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '0 min';
    const minutes = Math.floor(Number(ms) / 60000);
    const seconds = Math.floor((Number(ms) % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Desconhecido') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-tight truncate">{call.title || 'Cliente Externo'}</h3>
              <p className="text-[10px] text-slate-500 font-medium">{formatSimpleDate(call.callTimestamp || call.updatedAt)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</p>
              <p className={cn(
                "text-xl font-black",
                Number(call.nota_spin) >= 7 ? "text-emerald-400" : "text-amber-400"
              )}>
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