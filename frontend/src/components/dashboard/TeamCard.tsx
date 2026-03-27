"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BarChart3, Target } from 'lucide-react';
import { calculateAverageSpin, getStatusCounts } from '@/lib/metrics';
import type { SDRCall } from '@/types';

interface TeamCardProps {
  teamName: string;
  calls: SDRCall[];
}

export function TeamCard({ teamName, calls }: TeamCardProps) {
  // 1. Médias e Status agora vêm filtrados (só DONE) do metrics.ts
  const avgSpin = calculateAverageSpin(calls);
  const statusCounts = getStatusCounts(calls);
  
  // 2. Contamos SDRs que tiveram pelo menos uma tentativa
  const sdrsCount = new Set(calls.map(c => c.ownerName).filter(Boolean)).size;

  // 3. MATEMÁTICA DA BARRA: Somamos apenas as que possuem status real
  const totalAnalyzed = statusCounts.APROVADO + statusCounts.ATENCAO + statusCounts.REPROVADO + statusCounts.NAO_IDENTIFICADO;

  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-50">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2 font-headline text-slate-900">
            <Users className="w-5 h-5 text-indigo-500" />
            {teamName}
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="bg-white border-slate-200 text-slate-500 font-bold">
              {calls.length} Tentativas
            </Badge>
            <span className="text-[9px] text-emerald-600 font-black uppercase">
              {totalAnalyzed} Analisadas
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase text-slate-400 font-black flex items-center gap-1 tracking-widest">
              <BarChart3 className="w-3 h-3" /> Média SPIN
            </p>
            <p className="text-3xl font-black text-slate-900">{avgSpin.toFixed(1)}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] uppercase text-slate-400 font-black flex items-center gap-1 justify-end tracking-widest">
              <Target className="w-3 h-3" /> SDRs Ativos
            </p>
            <p className="text-3xl font-black text-slate-900">{sdrsCount}</p>
          </div>
        </div>
        
        {/* BARRA DE PERFORMANCE (Só olha para o que é DONE) */}
        <div className="space-y-2">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
            {totalAnalyzed > 0 ? (
              <>
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${(statusCounts.APROVADO / totalAnalyzed) * 100}%` }}
                />
                <div 
                  className="bg-amber-400 h-full transition-all duration-500" 
                  style={{ width: `${(statusCounts.ATENCAO / totalAnalyzed) * 100}%` }}
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500" 
                  style={{ width: `${(statusCounts.REPROVADO / totalAnalyzed) * 100}%` }}
                />
              </>
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <span className="text-[8px] text-slate-300 font-bold uppercase">Sem dados produtivos</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
            <span className="text-emerald-600">{statusCounts.APROVADO} Aprov.</span>
            <span className="text-amber-500">{statusCounts.ATENCAO} Atenç.</span>
            <span className="text-rose-500">{statusCounts.REPROVADO} Reprov.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}