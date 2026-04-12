"use client";

import { useMemo } from 'react';
import { Trophy, ArrowRight, CheckCircle2, AlertCircle, Phone, Timer, Users, Star } from 'lucide-react';
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
        avgSpin: Number(stats.nota_media || 0)
      }))
      .sort((a, b) => b.avgSpin - a.avgSpin);
  }, [summary]);

  // 🏛️ OTIMIZAÇÃO: Filtro memorizado para evitar cálculos redundantes
  const eliteCalls = useMemo(() => 
    topCalls.filter(c => (c.nota_spin || 0) >= 7.0), 
  [topCalls]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 5) return "text-sky-500";
    return "text-rose-600";
  };

  const getStatusConfig = (avg: number, hasAnalyzed: boolean) => {
    if (!hasAnalyzed) return { bg: "bg-slate-50", icon: <Timer className="w-3 h-3" /> };
    if (avg >= 8) return { bg: "bg-emerald-50", icon: <CheckCircle2 className="w-3 h-3" /> };
    if (avg >= 5) return { bg: "bg-sky-50", icon: <AlertCircle className="w-3 h-3" /> };
    return { bg: "bg-rose-50", icon: <ArrowRight className="w-3 h-3 rotate-45" /> };
  };

  const handleSdrClick = (sdr: any) => {
    applyFilter({ ownerEmail: sdr.email, mode: 'ranking' });
  };

  return (
    <div className="space-y-6">
      {/* Vitrine Elite */}
      {eliteCalls.length > 0 && (
        <div className="bg-white border border-amber-100 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex items-center gap-2">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <h4 className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Vitrine Elite (Nota 7+)</h4>
          </div>
          <div className="divide-y divide-slate-50">
            {eliteCalls.map((call) => (
              <button 
                key={call.id} 
                onClick={() => openCall(call.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{call.contactName || 'Ligação'}</span>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {call.nota_spin?.toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ranking */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h3 className="text-[10px] font-bold text-slate-900 flex items-center gap-2 uppercase tracking-[0.15em]">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Ranking Performance
          </h3>
        </div>
        <div className="divide-y divide-slate-50">
          {ranking.map((sdr, index) => {
            const hasAnalyzed = sdr.validCount > 0;
            const status = getStatusConfig(sdr.avgSpin, hasAnalyzed);
            return (
              <button key={`${sdr.email}-${index}`} onClick={() => handleSdrClick(sdr)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all text-left">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black w-5 text-slate-300">{String(index + 1).padStart(2, '0')}</span>
                  <p className="text-[11px] font-bold text-slate-700 uppercase">{sdr.name}</p>
                </div>
                <div className={cn("px-1.5 py-0.5 rounded font-bold text-xs", status.bg)}>
                  <span className={cn("font-bold", getScoreColor(sdr.avgSpin))}>{hasAnalyzed ? sdr.avgSpin.toFixed(1) : "--"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}