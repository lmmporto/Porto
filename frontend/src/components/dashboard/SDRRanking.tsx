"use client";

import { useMemo } from 'react';
import { Trophy, ArrowRight, CheckCircle2, AlertCircle, Timer, Star } from 'lucide-react';
import type { DashboardSummary, SDRCall } from '@/types';
import { cn } from '@/lib/utils';
import { useCallContext } from '@/context/CallContext';

interface SDRRankingProps {
  summary: DashboardSummary | null;
  topCalls?: SDRCall[];
}

export function SDRRanking({ summary, topCalls = [] }: SDRRankingProps) {
  const { applyFilter, openCall } = useCallContext();

  const ranking = useMemo(() => {
    const entries = Object.entries(summary?.sdr_ranking ?? {});
    return entries
      .map(([key, stats]: [string, any]) => ({
        name: stats.ownerName || key,
        email: stats.ownerEmail || key,
        totalCalls: Number(stats.calls || 0),
        // 🚩 CORREÇÃO: Sincronizado com o campo 'calls' do backend
        validCount: Number(stats.calls || 0), 
        avgSpin: Number(stats.nota_media || 0),
      }))
      .sort((a, b) => b.avgSpin - a.avgSpin);
  }, [summary]);

  const eliteCalls = useMemo(() =>
    topCalls.filter(c => (c.nota_spin || 0) >= 7.0),
    [topCalls]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 5) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getStatusIcon = (avg: number, hasAnalyzed: boolean) => {
    if (!hasAnalyzed) return <Timer className="w-3 h-3 text-slate-600" />;
    if (avg >= 8) return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    if (avg >= 5) return <AlertCircle className="w-3 h-3 text-amber-500" />;
    return <ArrowRight className="w-3 h-3 rotate-45 text-rose-500" />;
  };

  const handleSdrClick = (sdr: any) => {
    applyFilter({ ownerEmail: sdr.email, mode: 'ranking' });
  };

  return (
    <div className="space-y-4">
      {/* ─── Vitrine Elite (O Top 10) ─────────────────────────────────── */}
      <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-lg shadow-amber-500/5">
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              Top 10 Elite
            </h4>
          </div>
          <span className="text-[8px] font-bold text-amber-500/60 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
            GLOBAL
          </span>
        </div>
        
        <div className="divide-y divide-slate-800/60 max-h-[300px] overflow-y-auto custom-scrollbar">
          {eliteCalls.length === 0 ? (
            <p className="px-4 py-4 text-center text-[9px] text-slate-600 italic">Aguardando chamadas nota 7+...</p>
          ) : (
            eliteCalls.slice(0, 10).map((call, idx) => (
              <button
                key={call.id}
                onClick={() => openCall(call.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-500/5 transition-all text-left group"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-700">#{idx + 1}</span>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 truncate">
                    {(call.ownerName || 'SDR').split(' ')[0]} • {(call.title || 'Chamada').substring(0, 15)}...
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {call.nota_spin?.toFixed(1)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── Ranking Performance ────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            Ranking Performance
          </h3>
        </div>

        <div className="divide-y divide-slate-800/60">
          {ranking.length === 0 ? (
            <p className="px-4 py-6 text-center text-[10px] text-slate-600 italic">
              Sem dados de ranking ainda.
            </p>
          ) : (
            ranking.map((sdr, index) => {
              const hasAnalyzed = sdr.validCount > 0;
              return (
                <button
                  key={`${sdr.email}-${index}`}
                  onClick={() => handleSdrClick(sdr)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-black w-5 text-slate-700 flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 uppercase truncate transition-colors">
                        {sdr.name}
                      </p>
                      <p className="text-[9px] text-slate-700 tabular-nums">
                        {sdr.totalCalls} chamadas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {getStatusIcon(sdr.avgSpin, hasAnalyzed)}
                    <span className={cn('font-black text-sm tabular-nums', getScoreColor(sdr.avgSpin))}>
                      {hasAnalyzed ? sdr.avgSpin.toFixed(1) : '--'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}