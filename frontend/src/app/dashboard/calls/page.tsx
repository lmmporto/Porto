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
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

export default function CallsListPage() {
  const { calls, isLoading, applyFilter, loadMore, refresh, hasMore } = useCallContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // 🚩 "as any" desativa o alerta vermelho do TypeScript para propriedades flexíveis
    applyFilter({
      startDate: '',
      endDate: '',
      sort: 'date_desc',
      minScore: 0
    } as any);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      toast({ title: "Exportação Concluída", description: `${filteredCalls.length} chamadas exportadas.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro na Exportação" });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (call: SDRCall) => {
    const isDone = call.processingStatus === "DONE";
    const isRotaC = call.status_final === "NAO_SE_APLICA";
    const nota = Number(call.nota_spin || 0);

    if (isRotaC) {
      return (
        <Badge className="bg-slate-100 text-slate-500 border-slate-200 shadow-none uppercase text-[9px] font-bold">
          <MinusCircle className="w-3 h-3 mr-1" /> Descarte
        </Badge>
      );
    }

    if (!isDone) {
      const isProcessing = call.processingStatus === "PROCESSING";
      return (
        <Badge className="bg-blue-50 text-blue-600 border-blue-100 shadow-none uppercase text-[9px] font-bold">
          {isProcessing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Hourglass className="w-3 h-3 mr-1" />}
          {isProcessing ? "Analisando" : "Tentativa"}
        </Badge>
      );
    }

    if (nota >= 8) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none uppercase text-[9px] font-bold">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
        </Badge>
      );
    }
    if (nota >= 5) {
      return (
        <Badge className="bg-sky-50 text-sky-700 border-sky-200 shadow-none uppercase text-[9px] font-bold">
          <AlertCircle className="w-3 h-3 mr-1" /> Atenção
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-50 text-rose-700 border-rose-200 shadow-none uppercase text-[9px] font-bold">
        <XCircle className="w-3 h-3 mr-1" /> Reprovado
      </Badge>
    );
  };

  const filteredCalls = calls.filter(call =>
    call.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold text-slate-900">Histórico de Chamadas</h1>
          <p className="text-slate-400 text-sm mt-1">Dados consolidados de todas as avaliações e tentativas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-bold uppercase tracking-wider"
            onClick={() => refresh()}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-bold uppercase tracking-wider"
            onClick={handleExportZip}
            disabled={isExporting || filteredCalls.length === 0}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileArchive className="w-4 h-4 mr-2" />}
            Exportar ZIP
          </Button>
        </div>
      </div>

      <ManualTriggerCard theme="light" />

      <Card className="border-slate-100 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
              <Input
                className="pl-10 h-9 text-sm border-slate-100 focus:border-slate-300"
                placeholder="Buscar por título, SDR ou time..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-slate-50/50">
                  <tr className="border-b border-slate-100 transition-colors">
                    <th className="h-10 px-4 text-left align-middle font-bold text-[10px] text-slate-400 uppercase tracking-widest">Título</th>
                    <th className="h-10 px-4 text-left align-middle font-bold text-[10px] text-slate-400 uppercase tracking-widest">SDR / Time</th>
                    <th className="h-10 px-4 text-left align-middle font-bold text-[10px] text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="h-10 px-4 text-left align-middle font-bold text-[10px] text-slate-400 uppercase tracking-widest text-center">Nota</th>
                    <th className="h-10 px-4 text-left align-middle font-bold text-[10px] text-slate-400 uppercase tracking-widest">Duração</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-slate-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {isLoading && calls.length === 0 ? (
                    <tr><td colSpan={6} className="h-32 text-center text-slate-400 text-xs italic">Carregando chamadas...</td></tr>
                  ) : filteredCalls.length === 0 ? (
                    <tr><td colSpan={6} className="h-32 text-center text-slate-400 text-xs italic">Nenhuma chamada encontrada.</td></tr>
                  ) : (
                    filteredCalls.map((call) => (
                      <tr key={call.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/30 group">
                        <td className="p-4 align-middle font-semibold text-slate-900 text-xs">{call.title || 'Chamada sem Título'}</td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-700">{call.ownerName}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tight">{call.teamName}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          {getStatusBadge(call)}
                        </td>
                        <td className={`p-4 align-middle font-bold text-center ${call.processingStatus === 'DONE' && Number(call.nota_spin) < 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {call.processingStatus === "DONE" && call.status_final !== "NAO_SE_APLICA"
                            ? Number(call.nota_spin || 0).toFixed(1)
                            : "--"}
                        </td>
                        <td className="p-4 align-middle text-slate-500 text-xs font-medium">
                          {(() => {
                            const ms = Number(call.durationMs || 0);
                            const min = Math.floor(ms / 60000);
                            const sec = Math.floor((ms % 60000) / 1000);
                            return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
                          })()}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Button asChild size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
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

            {hasMore && (
              <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/50">
                <Button
                  variant="ghost"
                  className="w-full max-sm py-6 text-slate-400 hover:text-indigo-600 font-bold text-xs tracking-widest uppercase border-2 border-dashed border-slate-200 rounded-xl"
                  onClick={() => loadMore()}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Carregar mais chamadas"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}