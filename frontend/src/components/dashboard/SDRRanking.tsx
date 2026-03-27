"use client";

import { useMemo } from 'react';
import { Trophy, ArrowRight, CheckCircle2, MinusCircle, Phone, Timer } from 'lucide-react';
import Link from 'next/link';
import type { DashboardSummary } from '@/types';
import { cn } from '@/lib/utils';

// --- UTILS ---

/**
 * Exemplo de conversão segura para Firebase Timestamps no Frontend
 */
export const formatDate = (dateInput: any) => {
  if (!dateInput) return '--/--';
  
  // 🚩 Verificação de Timestamps do Firebase (_seconds ou seconds)
  const seconds = dateInput?._seconds || dateInput?.seconds;
  
  if (seconds) {
    return new Date(seconds * 1000).toLocaleDateString('pt-BR');
  }
  
  // Caso o back-end já tenha enviado como string ISO ou Date
  return new Date(dateInput).toLocaleDateString('pt-BR');
};

// --- COMPONENTE ---

interface SDRRankingProps {
  summary: DashboardSummary | null;
}

export function SDRRanking({ summary }: SDRRankingProps) {
  // 🚩 REVISÃO DE LÓGICA: Usando useMemo para evitar re-cálculos desnecessários
  const ranking = useMemo(() => {
    if (!summary?.sdr_ranking) return [];

    return Object.entries(summary.sdr_ranking)
      .map(([name, stats]: [string, any]) => {
        // Garantimos que os nomes das propriedades batam com o que o back-end envia
        const validCount = Number(stats.valid_calls || stats.valid_count || 0);
        const sumNotes = Number(stats.sum_notes || 0);
        const avgSpin = validCount > 0 ? sumNotes / validCount : 0;

        return {
          name,
          valid_count: validCount,
          avgSpin
        };
      })
      .sort((a, b) => b.avgSpin - a.avgSpin);
  }, [summary]);

  /**
   * Configuração de cores inteligente baseada na nota do Cofre
   */
  const getStatusConfig = (avg: number, hasAnalyzed: boolean) => {
    if (!hasAnalyzed) {
      return { 
        color: "text-slate-400", 
        bg: "bg-slate-50", 
        icon: <Timer className="w-3 h-3" /> 
      };
    }
    
    // Threshold ajustado para 7.5 conforme solicitado
    if (avg >= 7.5) return { color: "text-emerald-500", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-3 h-3" /> };
    if (avg >= 5) return { color: "text-amber-500", bg: "bg-amber-50", icon: <MinusCircle className="w-3 h-3" /> };
    
    return { 
      color: "text-rose-500", 
      bg: "bg-rose-50", 
      icon: <ArrowRight className="w-3 h-3 rotate-45" /> 
    };
  };

  if (!summary || ranking.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-8 text-center">
        <p className="text-xs text-slate-400 italic">Nenhum rastro encontrado no cofre.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-slate-900 flex items-center gap-2 uppercase tracking-[0.15em]">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          Ranking Performance
        </h3>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter flex items-center gap-1">
          <Phone className="w-2.5 h-2.5" /> {summary.total_calls} Vol. Total
        </span>
      </div>
      
      <div className="divide-y divide-slate-50">
        {ranking.map((sdr, index) => {
          const hasAnalyzed = sdr.valid_count > 0;
          const status = getStatusConfig(sdr.avgSpin, hasAnalyzed);
          
          return (
            <Link 
              key={sdr.name} 
              href={`/dashboard/sdrs/${encodeURIComponent(sdr.name)}`}
              className={cn(
                "flex items-center justify-between p-4 transition-all group",
                hasAnalyzed ? "hover:bg-slate-50" : "opacity-60 grayscale-[0.5]"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black w-5 text-center",
                  !hasAnalyzed ? "text-slate-200" :
                  index === 0 ? "text-amber-500" : 
                  index === 1 ? "text-slate-400" : 
                  index === 2 ? "text-amber-700" : "text-slate-300"
                )}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                
                <div>
                  <p className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase">
                    {sdr.name}
                  </p>
                  <p className={cn(
                    "text-[9px] font-bold flex items-center gap-1",
                    hasAnalyzed ? "text-emerald-500" : "text-slate-400"
                  )}>
                    {hasAnalyzed ? (
                      <>{sdr.valid_count} {sdr.valid_count === 1 ? 'analisada' : 'analisadas'}</>
                    ) : (
                      "Aguardando reunião qualificada"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-xs mb-0.5",
                    status.color,
                    status.bg
                  )}>
                    {status.icon}
                    {hasAnalyzed ? sdr.avgSpin.toFixed(1) : "--"}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Nota Spin</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
          Consolidado via Cofre de Saldos
        </p>
      </div>
    </div>
  );
}