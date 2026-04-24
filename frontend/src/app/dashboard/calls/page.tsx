"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
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
import { ManualTriggerCard } from '@/components/dashboard/ManualTriggerCard';
import { getPaginatedCalls } from '@/features/calls/api/calls.service';
import { useDashboard } from '@/context/DashboardContext';

import { CallsTable } from '@/features/calls/components/calls-table';

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CallsListPage() {
  const { viewingEmail, isAdmin } = useDashboard();
  const [calls, setCalls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  // Paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [cursors, setCursors] = useState<any[]>([null]);
  
  const { toast } = useToast();

  const fetchPageData = useCallback(async (pageNum: number, cursor: any = null) => {
    setIsLoading(true);
    try {
      const emailToSearch = (isAdmin && viewingEmail) ? viewingEmail : (isAdmin ? null : viewingEmail);
      
      const { calls: newCalls, lastVisibleDoc, hasNextPage: hasMore } = await getPaginatedCalls(
        10,
        cursor,
        emailToSearch
      );

      setCalls(newCalls);
      setHasNextPage(hasMore);
      
      if (hasMore && lastVisibleDoc) {
        setCursors(prev => {
          const newCursors = [...prev];
          newCursors[pageNum] = lastVisibleDoc;
          return newCursors;
        });
      }
    } catch (error) {
      console.error("Erro ao buscar chamadas:", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar chamadas' });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, viewingEmail, toast]);

  useEffect(() => {
    setPage(1);
    setCursors([null]);
    fetchPageData(1, null);
  }, [viewingEmail, fetchPageData]);

  const handleNextPage = () => {
    if (hasNextPage) {
      const nextPage = page + 1;
      const cursor = cursors[page];
      setPage(nextPage);
      fetchPageData(nextPage, cursor);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      const cursor = cursors[prevPage - 1];
      setPage(prevPage);
      fetchPageData(prevPage, cursor);
    }
  };

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
            onClick={() => fetchPageData(page, cursors[page-1])}
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
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <Input
            className="pl-10 h-10 bg-slate-900/60 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-0 rounded-xl"
            placeholder="Buscar por título, SDR ou time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <CallsTable 
          calls={filteredCalls}
          isLoading={isLoading}
          page={page}
          hasNextPage={hasNextPage}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
        />
      </div>
    </div>
  );
}