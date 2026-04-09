"use client";

import { useMemo } from 'react';
import { Trophy, Medal, Target, ArrowUpRight } from 'lucide-react';
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/types';

interface TopSDRRankingProps {
  summary: DashboardSummary | null;
}

export function TopSDRRanking({ summary }: TopSDRRankingProps) {
  const { isAdmin } = useDashboard();
  const { applyFilter } = useCallContext();

  const top6 = useMemo(() => {
    if (!summary?.sdr_ranking) return [];
    const entries = Object.entries(summary.sdr_ranking);

    return entries
      .map(([key, stats]: [string, any]) => ({
        name: stats.ownerName || key,
        email: stats.ownerEmail,
        score: Number(stats.nota_media || 0),
        volume: Number(stats.calls || 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [summary]);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return { color: "text-amber-400", bg: "bg-amber-400/10", icon: <Trophy className="w-4 h-4" /> };
      case 1: return { color: "text-slate-300", bg: "bg-slate-300/10", icon: <Medal className="w-4 h-4" /> };
      case 2: return { color: "text-orange-400", bg: "bg-orange-400/10", icon: <Medal className="w-4 h-4" /> };
      default: return { color: "text-slate-500", bg: "bg-slate-800/50", icon: null };
    }
  };

  if (top6.length === 0) return null;

  return (
    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full">
      <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Target className="w-4 h-4" /> Elite Performance (Top 6)
        </h3>
      </div>

      <div className="divide-y divide-slate-800/50">
        {top6.map((sdr, index) => {
          const style = getRankStyle(index);
          
          return (
            <button
              key={sdr.email || sdr.name}
              onClick={() => {
                if (isAdmin) {
                  applyFilter({ 
                    ownerEmail: sdr.email, 
                    mode: 'ranking' // 🚩 Ativa o modo vitrine no backend
                  });
                }
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0",
                  style.bg,
                  style.color
                )}>
                  {style.icon ? style.icon : index + 1}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors uppercase truncate">
                    {sdr.name.split(' ')[0]} {sdr.name.split(' ')[1] || ''}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                    {sdr.volume} Chamadas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className={cn("text-lg font-black leading-none", style.color)}>
                    {sdr.score.toFixed(1)}
                  </p>
                  <p className="text-[8px] font-bold text-slate-600 uppercase">Score</p>
                </div>
                <ArrowUpRight className="w-3 h-3 text-slate-700 group-hover:text-indigo-500 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-900/50 text-center border-t border-slate-800">
         <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Atualizado em tempo real</p>
      </div>
    </div>
  );
}
