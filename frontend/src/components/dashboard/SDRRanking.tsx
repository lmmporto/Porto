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
        validCount: Number(stats.valid_calls || 0),
        avgSpin: Number(stats.nota_media || 0),
      }))
      .sort((a, b) => b.avgSpin - a.avgSpin);
  }, [summary]);

  const eliteCalls = useMemo(() =>
    topCalls.filter(c => (c.nota_spin || 0) >= 7.0),
    [topCalls]);

  // Cor do score adaptada para dark — tons suaves, não saturados
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 5) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Ícone de status — sem bg colorido, só ícone tonal
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

      {/* ─── Vitrine Elite ─────────────────────────────────────────── */}
      {eliteCalls.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl overflow-hidden">
          {/* Header da vitrine */}
          <div className="px-4 py-3 border-b border-amber-500/10 flex items-center gap-2">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <h4 className="text-[9px] font-bold text-amber-400/80 uppercase tracking-widest">
              Vitrine Elite — Nota 7+
            </h4>
          </div>
          {/* Lista */}
          <div className="divide-y divide-slate-800/60">
            {eliteCalls.map((call) => (
              <button
                key={call.id}
                onClick={() => openCall(call.id)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left group"
              >
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 uppercase truncate transition-colors">
                  {call.contactName || 'Ligação'}
                </span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md ml-2 flex-shrink-0">
                  {call.nota_spin?.toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Ranking ───────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header do ranking */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            Ranking Performance
          </h3>
        </div>

        {/* Lista de SDRs */}
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