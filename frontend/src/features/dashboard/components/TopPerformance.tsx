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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white tracking-tight">Grid de Performance</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-purple/60">SDR Leaderboard</span>
      </div>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {sdrs.map((sdr, index) => (
          <Link 
            key={sdr.id} 
            href={`/dashboard/sdrs/${sdr.id}`}
            className="block group hover:scale-[1.02] transition-all duration-300 ease-out"
          >
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar com Gradiente */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#7C72FF] to-[#2DD4BF] flex items-center justify-center shadow-lg">
                  {sdr.picture ? (
                    <img src={sdr.picture} alt={sdr.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-white">{getInitials(sdr.name)}</span>
                  )}
                </div>
                
                <div>
                  <p className="text-[15px] font-bold text-white leading-tight">{sdr.name}</p>
                  <p className="text-[11px] text-white/40 font-medium mt-0.5">{sdr.teamName || 'Equipe não definida'}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={cn(
                  "text-xl font-black tabular-nums drop-shadow-sm",
                  (sdr.real_average || 0) >= 7 ? "text-[#10B981]" : (sdr.real_average || 0) <= 5 ? "text-[#FF4B5C]" : "text-white/80"
                )}>
                  {(sdr.real_average || 0).toFixed(1)}
                </div>
                <div className="text-[9px] uppercase tracking-tighter text-white/20 font-bold">Média SPIN</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
