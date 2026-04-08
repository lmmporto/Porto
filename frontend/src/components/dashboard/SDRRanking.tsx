"use client";

import { useMemo } from 'react';
import { Trophy, ArrowRight, CheckCircle2, AlertCircle, Phone, Timer, Users } from 'lucide-react';
import Link from 'next/link';
import type { DashboardSummary } from '@/types';
import { cn } from '@/lib/utils';
import { useCallContext } from '@/context/CallContext';

interface SDRRankingProps {
  summary: DashboardSummary | null;
}

export function SDRRanking({ summary }: SDRRankingProps) {
  const { applyFilter } = useCallContext();

  const ranking = useMemo(() => {
    const entries = Object.entries(summary?.sdr_ranking ?? {});

    return entries
      .map(([key, stats]: [string, any]) => {
        return {
          name: stats.ownerName || key, 
          email: stats.ownerEmail || key, 
          totalCalls: Number(stats.calls || 0),
          validCount: Number(stats.valid_calls || 0),
          avgSpin: Number(stats.nota_media || 0)
        };
      })
      .sort((a, b) => b.avgSpin - a.avgSpin);
  }, [summary]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 5) return "text-sky-500";
    return "text-rose-600";
  };

  const getStatusConfig = (avg: number, hasAnalyzed: boolean) => {
    if (!hasAnalyzed) {
      return { color: "text-slate-400", bg: "bg-slate-50", icon: <Timer className="w-3 h-3" /> };
    }
    if (avg >= 8) return { color: "text-emerald-500", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-3 h-3" /> };
    if (avg >= 5) return { color: "text-sky-500", bg: "bg-sky-50", icon: <AlertCircle className="w-3 h-3" /> };
    return { color: "text-rose-500", bg: "bg-rose-50", icon: <ArrowRight className="w-3 h-3 rotate-45" /> };
  };

  // 🚩 AÇÃO DE FILTRO SÊNIOR COM LOG DE AUDITORIA
  const handleSdrClick = (sdrEmail: string) => {
    console.log(`🔎 [RANKING CLICK] SDR selecionado: ${sdrEmail}`);
    applyFilter({ ownerEmail: sdrEmail });
  };

  if (ranking.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-8 text-center">
        <p className="text-xs text-slate-400 italic">Nenhum rastro encontrado no cofre para este período.</p>
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
          <Phone className="w-2.5 h-2.5" /> {summary?.total_calls || 0} Vol. Total
        </span>
      </div>
      
      <div className="divide-y divide-slate-50">
        {ranking.map((sdr, index) => {
          const hasAnalyzed = sdr.validCount > 0;
          const status = getStatusConfig(sdr.avgSpin, hasAnalyzed);
          
          return (
            <Link 
              key={sdr.email} 
              href={`/dashboard/sdrs/${encodeURIComponent(sdr.name)}`}
              onClick={() => handleSdrClick(sdr.email)}
              className={cn(
                "flex items-center justify-between p-4 transition-all group",
                sdr.totalCalls > 0 ? "hover:bg-slate-50" : "opacity-60 grayscale-[0.5]"
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" /> Vol: {sdr.totalCalls}
                    </p>
                    <span className="text-[8px] text-slate-200">|</span>
                    <p className={cn(
                      "text-[9px] font-bold",
                      hasAnalyzed ? "text-emerald-500" : "text-slate-300"
                    )}>
                      Av: {sdr.validCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-xs mb-0.5",
                    status.bg
                  )}>
                    {status.icon}
                    <span className={cn("font-bold", getScoreColor(sdr.avgSpin))}>
                      {hasAnalyzed ? sdr.avgSpin.toFixed(1) : "--"}
                    </span>
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