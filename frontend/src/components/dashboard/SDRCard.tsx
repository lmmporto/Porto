"use client";

import React, { useMemo } from 'react';
import { 
  User, 
  TrendingUp, 
  Phone, 
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- TIPAGEM ---

interface SDRRankingProps {
  summary: {
    sdr_ranking?: Record<string, any>;
  } | null;
}

interface SDRCardProps {
  name: string;
  stats: {
    valid_count: number;
    calls: number;
    avgSpin: number;
  };
  index?: number;
}

// --- COMPONENTE: SDR CARD ---

export function SDRCard({ name, stats, index }: SDRCardProps) {
  // Cores baseadas na nota
  const getPerformanceColor = (score: number) => {
    if (score >= 8) return "text-emerald-500 border-emerald-100 bg-emerald-50";
    if (score >= 5) return "text-amber-500 border-amber-100 bg-amber-50";
    return "text-rose-500 border-rose-100 bg-rose-50";
  };

  const perfStyle = getPerformanceColor(stats.avgSpin);

  return (
    <Link 
      href={`/dashboard/sdrs/${encodeURIComponent(name)}`}
      className="block group"
    >
      <div className="bg-white border border-slate-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:border-indigo-100 group-hover:-translate-y-1">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {/* Avatar / Posição */}
            <div className="relative">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <User className="w-6 h-6" />
              </div>
              {index !== undefined && (
                <div className={cn(
                  "absolute -top-2 -left-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm border",
                  index === 0 ? "bg-amber-400 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-500"
                )}>
                  {index + 1}º
                </div>
              )}
            </div>

            {/* Info do SDR */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                {name}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Phone className="w-3 h-3" /> {stats.calls} chamadas
                </span>
              </div>
            </div>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border font-black text-sm",
                perfStyle
              )}>
                <TrendingUp className="w-3.5 h-3.5" />
                {stats.avgSpin > 0 ? stats.avgSpin.toFixed(1) : "--"}
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Média Spin</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- COMPONENTE: SDR RANKING (LISTA) ---

export function SDRRanking({ summary }: SDRRankingProps) {
  const ranking = useMemo(() => {
    if (!summary?.sdr_ranking) return [];

    return Object.entries(summary.sdr_ranking)
      .map(([name, stats]: [string, any]) => {
        // 🚩 Garante que estamos pegando os nomes certos vindos do Backend
        const validCount = Number(stats.valid_calls || stats.valid_count || 0);
        const totalNotes = Number(stats.sum_notes || 0);
        const avgSpin = validCount > 0 ? totalNotes / validCount : 0;

        return {
          name,
          valid_count: validCount,
          calls: Number(stats.calls || stats.total || 0),
          avgSpin: avgSpin
        };
      })
      .sort((a, b) => b.avgSpin - a.avgSpin);
  }, [summary]);

  return (
    <div className="space-y-3">
      {ranking.length > 0 ? (
        ranking.map((sdr, index) => (
          <SDRCard 
            key={sdr.name} 
            name={sdr.name} 
            stats={sdr} 
            index={index} 
          />
        ))
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
          <p className="text-slate-400 text-sm italic">Nenhum dado de ranking disponível.</p>
        </div>
      )}
    </div>
  );
}