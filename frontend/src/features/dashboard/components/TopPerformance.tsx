"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeToRanking } from "@/features/dashboard/api/dashboard.service";
import { cn, getInitials } from "@/lib/utils";

interface TopPerformanceProps {
  filters?: { period: string; team?: string; }; 
}

export const TopPerformance = ({ filters }: TopPerformanceProps) => {
  const [sdrs, setSdrs] = useState<any[]>([]);
  const currentPeriod = filters?.period || 'Tudo'; 
  const currentTeam = filters?.team || 'all';

  useEffect(() => {
    const unsubscribe = subscribeToRanking(currentPeriod, currentTeam, setSdrs);
    return () => unsubscribe();
  }, [currentPeriod, currentTeam]);

  return (
    <div className="glass-card p-6 rounded-[24px] border border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Mosaico de Performance</h3>
          <p className="text-xs text-white/40 mt-1">Visão Geral do Time</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple px-3 py-1 bg-purple/10 rounded-full border border-purple/20">Elite Squad</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {sdrs.map((sdr) => (
          <Link 
            key={sdr.id} 
            href={`/dashboard/sdrs/${sdr.id}`}
            className="block group hover:scale-[1.02] transition-all duration-300"
          >
            <div className="relative overflow-hidden bg-white/5 p-5 rounded-2xl border border-white/5 group-hover:bg-white/10 group-hover:border-primary/30 transition-all">
              {/* Badge de Score Neon */}
              <div className={cn(
                "absolute top-3 right-3 px-2 py-1 rounded-lg text-[13px] font-black tabular-nums shadow-[0_0_15px_rgba(0,0,0,0.3)]",
                (sdr.real_average || 0) >= 7 ? "bg-[#10B981] text-white shadow-[#10B981]/20" : 
                (sdr.real_average || 0) <= 5 ? "bg-[#FF4B5C] text-white shadow-[#FF4B5C]/20" : 
                "bg-white/20 text-white"
              )}>
                {(sdr.real_average || 0).toFixed(1)}
              </div>

              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center shadow-xl mb-4 border-2 border-white/5 group-hover:border-primary/50 transition-colors">
                  {sdr.picture ? (
                    <img src={sdr.picture} alt={sdr.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-white">{getInitials(sdr.name)}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-[16px] font-bold text-white group-hover:text-primary transition-colors">{sdr.name}</p>
                  <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">
                    {sdr.teamName || 'Equipe não definida'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 w-full flex justify-around">
                  <div className="text-center">
                    <p className="text-[10px] text-white/30 uppercase font-bold">Calls</p>
                    <p className="text-sm font-bold text-white/80">{sdr.total_calls || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-white/30 uppercase font-bold">Score</p>
                    <p className="text-sm font-bold text-white/80">{sdr.ranking_score?.toFixed(1) || '0.0'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
