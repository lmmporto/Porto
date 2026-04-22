# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/calls/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **311**
- Imports detectados: **12**
- Exports detectados: **2**
- Funções/classes detectadas: **5**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: CallsListPage, function. Funções/classes detectadas: CallsListPage, NotaCell, StatusBadge, formatDuration, handleExportZip. Dependências locais detectadas: @/components/dashboard/ManualTriggerCard, @/components/ui/badge, @/components/ui/button, @/components/ui/input, @/context/CallContext, @/hooks/use-toast, @/types. Dependências externas detectadas: file-saver, jszip, lucide-react, next/link, react. Temas relevantes detectados: calls, dashboard, sdr, team. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component.

## Dependências locais
- `@/components/dashboard/ManualTriggerCard`
- `@/components/ui/badge`
- `@/components/ui/button`
- `@/components/ui/input`
- `@/context/CallContext`
- `@/hooks/use-toast`
- `@/types`

## Dependências externas
- `file-saver`
- `jszip`
- `lucide-react`
- `next/link`
- `react`

## Todos os imports detectados
- `@/components/dashboard/ManualTriggerCard`
- `@/components/ui/badge`
- `@/components/ui/button`
- `@/components/ui/input`
- `@/context/CallContext`
- `@/hooks/use-toast`
- `@/types`
- `file-saver`
- `jszip`
- `lucide-react`
- `next/link`
- `react`

## Exports detectados
- `CallsListPage`
- `function`

## Funções e classes detectadas
- `CallsListPage`
- `NotaCell`
- `StatusBadge`
- `formatDuration`
- `handleExportZip`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `dashboard`
- `sdr`
- `team`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`

## Código
```tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileArchive,
  Loader2,
  Hourglass,
  MinusCircle,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { SDRCall } from '@/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { useCallContext } from '@/context/CallContext';
import { ManualTriggerCard } from '@/components/dashboard/ManualTriggerCard';

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CallsListPage() {
  const { calls, isLoading, applyFilter, loadMore, refresh, hasMore } = useCallContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    applyFilter({
      startDate: '',
      endDate: '',
      sort: 'date_desc',
      minScore: 0,
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCalls = calls.filter(call =>
    call.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportZip = async () => {
    if (filteredCalls.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      filteredCalls.forEach((call) => {
        const fileName = `${call.id || 'call'}-${call.ownerName || 'sdr'}.json`;
        zip.file(fileName, JSON.stringify(call, null, 2));
      });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `analise-chamadas-export-${new Date().toISOString().split('T')[0]}.zip`);
      toast({ title: 'Exportação Concluída', description: `${filteredCalls.length} chamadas exportadas.` });
    } catch {
      toast({ variant: 'destructive', title: 'Erro na Exportação' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
            Histórico
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight">Chamadas Analisadas</h1>
          <p className="text-slate-500 text-sm mt-1">
            Avaliações consolidadas do seu time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExporting || filteredCalls.length === 0}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-30 transition-all text-xs font-bold uppercase tracking-wider"
          >
            {isExporting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <FileArchive className="w-3.5 h-3.5" />}
            Exportar ZIP
          </button>
        </div>
      </div>

      {/* ─── Gatilho manual ──────────────────────────────────────────── */}
      <ManualTriggerCard theme="dark" />

      {/* ─── Tabela ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <Input
              className="pl-10 h-9 text-sm bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-0 rounded-lg"
              placeholder="Buscar por título, SDR ou time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
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
              {isLoading && calls.length === 0 ? (

                <tr>
                  <td colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                      <span className="text-slate-600 text-xs italic">Carregando chamadas…</span>
                    </div>
                  </td>
                </tr>

              ) : filteredCalls.length === 0 ? (

                <tr>
                  <td colSpan={6} className="h-40 text-center">
                    <span className="text-slate-600 text-xs italic">Nenhuma chamada encontrada.</span>
                  </td>
                </tr>

              ) : (

                filteredCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-slate-800/60 transition-colors hover:bg-slate-800/30 group"
                  >
                    {/* Título */}
                    <td className="p-4 align-middle">
                      <span className="font-semibold text-slate-200 text-xs leading-snug line-clamp-2">
                        {call.title || 'Chamada sem Título'}
                      </span>
                    </td>

                    {/* SDR / Time */}
                    <td className="p-4 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-xs text-slate-300">{call.ownerName}</span>
                        <span className="text-[10px] text-slate-600 uppercase tracking-tight">{call.teamName}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 align-middle">
                      <StatusBadge call={call} />
                    </td>

                    {/* Nota */}
                    <td className="p-4 align-middle text-center text-xs">
                      <NotaCell call={call} />
                    </td>

                    {/* Duração */}
                    <td className="p-4 align-middle text-slate-500 text-xs font-medium tabular-nums">
                      {formatDuration(Number(call.durationMs || 0))}
                    </td>

                    {/* Ação */}
                    <td className="p-4 align-middle text-right">
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Link href={`/dashboard/calls/${call.id}`}>
                          Revisar <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))

              )}
            </tbody>
          </table>
        </div>

        {/* Carregar mais */}
        {hasMore && (
          <div className="p-4 border-t border-slate-800 flex justify-center bg-slate-900/40">
            <Button
              variant="ghost"
              className="w-full py-5 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 font-bold text-xs tracking-widest uppercase border border-dashed border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all"
              onClick={() => loadMore()}
              disabled={isLoading}
            >
              {isLoading
                ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                : 'Carregar mais chamadas'}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
```
