"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  FileArchive,
  Loader2,
  Hourglass
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

export default function CallsListPage() {
  const [calls, setCalls] = useState<SDRCall[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // 🚩 Adicionado timestamp para evitar cache
    fetch(`/api/calls?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setCalls(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        setCalls([]);
        setIsLoading(false);
      });
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
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na Exportação" });
    } finally {
      setIsExporting(false);
    }
  };

  // 🚩 FUNÇÃO DE BADGE CORRIGIDA: Lida com casos sem nota (tentativas)
  const getStatusBadge = (call: SDRCall) => {
    const nota = call.nota_spin;
    const isProcessed = call.processingStatus === "DONE";

    if (!isProcessed && (!nota || nota === 0)) {
      return (
        <Badge className="bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-100 shadow-none">
          <Hourglass className="w-3 h-3 mr-1" /> Tentativa
        </Badge>
      );
    }

    if (nota >= 7) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 shadow-none">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
        </Badge>
      );
    } 
    if (nota >= 5) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 shadow-none">
          <AlertCircle className="w-3 h-3 mr-1" /> Atenção
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 shadow-none">
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
                  {isLoading ? (
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
                          {/* 🚩 AGORA ENVIAMOS A 'call' INTEIRA PARA A FUNÇÃO DECIDIR O BADGE */}
                          {getStatusBadge(call)}
                        </td>
                        <td className="p-4 align-middle font-bold text-slate-900 text-center">
                          {/* 🚩 PROTEÇÃO: Só tenta formatar nota se ela existir, senão mostra '--' */}
                          {call.processingStatus === "DONE" || (call.nota_spin !== null && call.nota_spin !== undefined) 
                             ? Number(call.nota_spin).toFixed(1) 
                             : "--"}
                        </td>
                        <td className="p-4 align-middle text-slate-500 text-xs">
                          {/* 🚩 PROTEÇÃO: Garante que durationMs seja um número antes da conta */}
                          {call.durationMs ? (Number(call.durationMs) / 60000).toFixed(1) : "0.0"} min
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}