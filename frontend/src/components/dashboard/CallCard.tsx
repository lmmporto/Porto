"use client";

import Link from 'next/link';
import { ChevronRight, Clock, Database, Radio, Hourglass, MinusCircle } from 'lucide-react';
import type { SDRCall } from '@/types';
import { cn } from '@/lib/utils';

interface CallCardProps {
  call: SDRCall;
}

export function CallCard({ call }: CallCardProps) {
  // 1. Regras de Negócio (Descarte ou Não Aplicável)
  const isSkipped = call.processingStatus === "SKIPPED_FOR_AUDIT" || call.processingStatus === "SKIPPED_SHORT_CALL";
  const isRotaC = call.status_final === "NAO_SE_APLICA";

  // 2. Cálculo Seguro da Nota
  let finalDisplayNota: number | null = null;
  if (!isSkipped && !isRotaC) {
    const potentialNota = Number(call.nota_spin);
    if (!isNaN(potentialNota) && potentialNota > 0) {
      finalDisplayNota = potentialNota;
    } else if (call.nota_spin === 0) {
       finalDisplayNota = 0;
    }
  }

  // 3. Sistema Centralizado de Cores (Padrão Stitch)
  const getTheme = () => {
    if (isSkipped || isRotaC || finalDisplayNota === null) return { bg: "bg-slate-200", text: "text-slate-400" };
    if (finalDisplayNota >= 7) return { bg: "bg-emerald-500", text: "text-emerald-600" };
    if (finalDisplayNota >= 5) return { bg: "bg-amber-500", text: "text-amber-600" };
    return { bg: "bg-rose-500", text: "text-rose-600" };
  };

  const theme = getTheme();

  // 4. Formatador Simples de Data (Lê direto a string ISO enviada pelo Backend novo)
  const formatSimpleDate = (isoString: any) => {
    if (!isoString || typeof isoString !== 'string') return '--/--';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return '--/--';
    }
  };

  // 5. Formatador de Duração
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '0 min';
    const minutes = Math.floor(Number(ms) / 60000);
    const seconds = Math.floor((Number(ms) % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  // 6. Gerador Inteligente de Iniciais do SDR (Para o Avatar)
  const getInitials = (name: string) => {
    if (!name || name === 'Desconhecido') return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Link href={`/dashboard/calls/${call.id}`}>
      <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/50 transition-all duration-300 gap-4 cursor-pointer">
        
        {/* Bloco Esquerdo: Informações Principais */}
        <div className="flex items-start gap-4 flex-1 overflow-hidden">
          
          {/* Indicador Lateral Elegante */}
          <div className={cn("w-1.5 h-12 rounded-full shrink-0 mt-1 transition-colors", theme.bg)} />
          
          <div className="space-y-2 flex-1 min-w-0">
            {/* Título da Ligação */}
            <h4 className="text-[15px] font-bold text-slate-800 line-clamp-1 pr-4 group-hover:text-indigo-600 transition-colors">
              {call.title || 'Chamada sem Título'}
            </h4>
            
            {/* Metadados (SDR, Duração, Data) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              
              {/* Avatar e Nome do SDR */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                 <div className="w-4 h-4 rounded-full bg-slate-200 text-[8px] flex items-center justify-center text-slate-600 shrink-0">
                   {getInitials(call.ownerName || 'Desconhecido')}
                 </div>
                 <span className="truncate max-w-[120px] text-slate-700">{call.ownerName || 'SDR Desconhecido'}</span>
              </div>

              {/* Duração */}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> 
                {formatDuration(call.durationMs)}
              </span>

              {/* Data Limpa */}
              <span className="text-slate-400">
                {formatSimpleDate(call.analyzedAt || call.updatedAt)}
              </span>

              {/* Origem (Tag Opcional) */}
              {call.source && (
                 <span className="flex items-center gap-1 opacity-50 ml-auto sm:ml-0">
                   {call.source === 'HUBSPOT' ? <Radio className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                   {call.source}
                 </span>
              )}
            </div>
          </div>
        </div>

        {/* Bloco Direito: Nota e Navegação */}
        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
          
          {/* Caixa da Nota */}
          <div className="text-right flex flex-col items-end min-w-[70px]">
            <div className={cn("text-2xl font-headline font-black leading-none tracking-tight", theme.text)}>
              {finalDisplayNota !== null ? finalDisplayNota.toFixed(1) : "--"}
            </div>
            
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">
              {isRotaC ? (
                <>ROTA C <MinusCircle className="w-3 h-3 text-slate-300" /></>
              ) : finalDisplayNota !== null ? (
                "NOTA SPIN"
              ) : (
                <>PROCESSANDO <Hourglass className="w-3 h-3 text-slate-300 animate-pulse" /></>
              )}
            </div>
          </div>
          
          {/* Seta de Ação */}
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors shrink-0">
             <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>

      </div>
    </Link>
  );
}