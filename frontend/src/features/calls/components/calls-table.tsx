import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Hourglass,
  MinusCircle,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { SDRCall } from '@/types';

// ─── Badge helper ─────────────────────────────────────────────────────────────

function StatusBadge({ call }: { call: SDRCall }) {
  const isDone = call.processingStatus === 'DONE';
  const isRotaC = call.status_final === 'NAO_SE_APLICA';
  const nota = Number(call.nota_spin || 0);

  if (isRotaC) {
    return (
      <Badge className="bg-slate-800 text-slate-400 border-slate-700 shadow-none uppercase text-[9px] font-bold">
        <MinusCircle className="w-3 h-3 mr-1" /> Descarte
      </Badge>
    );
  }

  if (!isDone) {
    const isProcessing = call.processingStatus === 'PROCESSING';
    return (
      <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-none uppercase text-[9px] font-bold">
        {isProcessing
          ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          : <Hourglass className="w-3 h-3 mr-1" />}
        {isProcessing ? 'Analisando' : 'Tentativa'}
      </Badge>
    );
  }

  if (nota >= 8) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none uppercase text-[9px] font-bold">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
      </Badge>
    );
  }
  if (nota >= 5) {
    return (
      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-none uppercase text-[9px] font-bold">
        <AlertCircle className="w-3 h-3 mr-1" /> Atenção
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-none uppercase text-[9px] font-bold">
      <XCircle className="w-3 h-3 mr-1" /> Reprovado
    </Badge>
  );
}

// ─── Nota cell ────────────────────────────────────────────────────────────────

function NotaCell({ call }: { call: SDRCall }) {
  const isDone = call.processingStatus === 'DONE';
  const isApplicable = call.status_final !== 'NAO_SE_APLICA';
  if (!isDone || !isApplicable) {
    return <span className="text-slate-600 font-bold">--</span>;
  }
  const nota = Number(call.nota_spin || 0);
  const colorClass =
    nota >= 8 ? 'text-emerald-400' :
      nota >= 5 ? 'text-amber-400' :
        'text-rose-400';
  return <span className={`font-black tabular-nums ${colorClass}`}>{nota.toFixed(1)}</span>;
}

// ─── Duração ─────────────────────────────────────────────────────────────────

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

interface CallsTableProps {
  calls: any[];
  isLoading: boolean;
  page: number;
  hasNextPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const CallsTable = ({ 
  calls, 
  isLoading, 
  page, 
  hasNextPage, 
  onNextPage, 
  onPrevPage 
}: CallsTableProps) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/40">
              <th className="h-10 px-4 text-left align-middle font-bold text-[9px] text-slate-500 uppercase tracking-widest">Título</th>
              <th className="h-10 px-4 text-left align-middle font-bold text-[9px] text-slate-500 uppercase tracking-widest">SDR / Time</th>
              <th className="h-10 px-4 text-left align-middle font-bold text-[9px] text-slate-500 uppercase tracking-widest">Status</th>
              <th className="h-10 px-4 text-center align-middle font-bold text-[9px] text-slate-500 uppercase tracking-widest">Nota</th>
              <th className="h-10 px-4 text-left align-middle font-bold text-[9px] text-slate-500 uppercase tracking-widest">Duração</th>
              <th className="h-10 px-4" />
            </tr>
          </thead>

          <tbody className="[&_tr:last-child]:border-0 divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    <span className="text-slate-600 text-xs italic">Carregando chamadas…</span>
                  </div>
                </td>
              </tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-40 text-center">
                  <span className="text-slate-600 text-xs italic">Nenhuma chamada encontrada.</span>
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr
                  key={call.id}
                  className="border-b border-slate-800/60 transition-colors hover:bg-slate-800/30 group"
                >
                  <td className="p-4 align-middle">
                    <span className="font-semibold text-slate-200 text-xs leading-snug line-clamp-2">
                      {call.title || 'Chamada sem Título'}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-xs text-slate-300">{call.ownerName}</span>
                      <span className="text-[10px] text-slate-600 uppercase tracking-tight">{call.teamName}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <StatusBadge call={call} />
                  </td>
                  <td className="p-4 align-middle text-center text-xs">
                    <NotaCell call={call} />
                  </td>
                  <td className="p-4 align-middle text-slate-500 text-xs font-medium tabular-nums">
                    {formatDuration(Number(call.durationMs || 0))}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    >
                      <Link href={`/dashboard/calls/${call.id}`}>
                        Revisar <ChevronRightIcon className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Paginação Controls ──────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Página {page}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={page === 1 || isLoading}
            className="h-8 bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-[10px] font-bold uppercase tracking-wider px-3"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage || isLoading}
            className="h-8 bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-[10px] font-bold uppercase tracking-wider px-3"
          >
            Próxima <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
