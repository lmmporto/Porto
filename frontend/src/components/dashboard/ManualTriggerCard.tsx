"use client";

import { useState } from 'react';
import {
  Link2,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// ─── Tipos locais ──────────────────────────────────────────────────────────────

type TriggerUiState =
  | 'IDLE'
  | 'SENDING'
  | 'QUEUED'
  | 'ALREADY_DONE'
  | 'ALREADY_QUEUED'
  | 'INVALID_LINK'
  | 'SERVER_ERROR';

interface TriggerResult {
  uiState: Exclude<TriggerUiState, 'IDLE' | 'SENDING'>;
  message: string;
  callId?: string;
}

// ─── Mapa de estados → aparência ──────────────────────────────────────────────

const STATE_CONFIG: Record<
  Exclude<TriggerUiState, 'IDLE' | 'SENDING'>,
  {
    icon: React.ElementType;
    label: string;
    containerClass: string;
    iconClass: string;
    textClass: string;
  }
> = {
  QUEUED: {
    icon: CheckCircle2,
    label: 'Análise iniciada',
    containerClass: 'bg-emerald-500/10 border-emerald-500/20',
    iconClass: 'text-emerald-400',
    textClass: 'text-emerald-200',
  },
  ALREADY_DONE: {
    icon: CheckCircle2,
    label: 'Já analisada',
    containerClass: 'bg-indigo-500/10 border-indigo-500/20',
    iconClass: 'text-indigo-400',
    textClass: 'text-indigo-200',
  },
  ALREADY_QUEUED: {
    icon: Clock,
    label: 'Em análise',
    containerClass: 'bg-sky-500/10 border-sky-500/20',
    iconClass: 'text-sky-400',
    textClass: 'text-sky-200',
  },
  INVALID_LINK: {
    icon: XCircle,
    label: 'Link inválido',
    containerClass: 'bg-rose-500/10 border-rose-500/20',
    iconClass: 'text-rose-400',
    textClass: 'text-rose-200',
  },
  SERVER_ERROR: {
    icon: AlertCircle,
    label: 'Erro',
    containerClass: 'bg-rose-500/10 border-rose-500/20',
    iconClass: 'text-rose-400',
    textClass: 'text-rose-200',
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────

interface ManualTriggerCardProps {
  /** Tema escuro (painel do SDR) ou claro (painel admin) */
  theme?: 'dark' | 'light';
}

export function ManualTriggerCard({ theme = 'dark' }: ManualTriggerCardProps) {
  const [url, setUrl] = useState('');
  const [uiState, setUiState] = useState<TriggerUiState>('IDLE');
  const [result, setResult] = useState<TriggerResult | null>(null);

  const isDark = theme === 'dark';

  // Valida minimamente o conteúdo no cliente antes de bater no servidor
  const isValidInput = url.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidInput) {
      setResult({
        uiState: 'INVALID_LINK',
        message: 'Cole um link ou ID de chamada do HubSpot.',
      });
      setUiState('INVALID_LINK');
      return;
    }

    setUiState('SENDING');
    setResult(null);

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/calls/manual-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: TriggerResult = await res.json();

      // Garante que o uiState do backend é um que conhecemos; usa SERVER_ERROR como fallback
      const knownStates: TriggerUiState[] = [
        'QUEUED',
        'ALREADY_DONE',
        'ALREADY_QUEUED',
        'INVALID_LINK',
        'SERVER_ERROR',
      ];
      const resolvedState: TriggerUiState = knownStates.includes(data.uiState as TriggerUiState)
        ? (data.uiState as TriggerUiState)
        : 'SERVER_ERROR';

      setResult({ ...data, uiState: resolvedState as TriggerResult['uiState'] });
      setUiState(resolvedState);

      // Limpa o campo apenas em caso de sucesso efetivo
      if (resolvedState === 'QUEUED') {
        setUrl('');
      }
    } catch {
      setResult({
        uiState: 'SERVER_ERROR',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      });
      setUiState('SERVER_ERROR');
    }
  };

  const handleReset = () => {
    setUiState('IDLE');
    setResult(null);
  };

  const isSending = uiState === 'SENDING';

  const cardClass = isDark
    ? 'bg-slate-900 border-slate-800 rounded-[2rem]'
    : 'border-slate-100 shadow-sm rounded-2xl bg-white';

  const labelClass = isDark
    ? 'text-[9px] font-black text-slate-500 uppercase tracking-widest'
    : 'text-[9px] font-black text-slate-400 uppercase tracking-widest';

  const titleClass = isDark
    ? 'text-sm font-bold text-white mt-1'
    : 'text-sm font-bold text-slate-900 mt-1';

  const inputClass = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 rounded-xl h-11 text-sm'
    : 'border-slate-200 focus:border-indigo-400 rounded-xl h-11 text-sm';

  return (
    <Card className={cardClass}>
      <CardContent className="p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
            <Link2 className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          <div>
            <p className={labelClass}>Análise Manual</p>
            <p className={titleClass}>Acionar ligação pelo link</p>
          </div>
        </div>

        {/* Dica */}
        <div className={`flex items-start gap-2 p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
          <Info className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Cole o link da chamada copiado do HubSpot. O sistema extrai o ID automaticamente e inicia a análise.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            id="manual-trigger-url"
            type="text"
            placeholder="https://app.hubspot.com/calls/... ou ID numérico"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              // Limpa feedback anterior ao editar
              if (uiState !== 'IDLE' && uiState !== 'SENDING') {
                handleReset();
              }
            }}
            disabled={isSending}
            className={inputClass}
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={isSending || !isValidInput}
            className={`h-11 px-4 font-bold rounded-xl flex-shrink-0 transition-all ${isDark
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-600'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="ml-2 text-xs uppercase tracking-wider">
              {isSending ? 'Enviando' : 'Analisar'}
            </span>
          </Button>
        </form>

        {/* Estado de envio */}
        {isSending && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${isDark ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-100'}`}>
            <Loader2 className={`w-3.5 h-3.5 animate-spin flex-shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
            <p className={`text-[11px] font-medium ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              Enviando solicitação…
            </p>
          </div>
        )}

        {/* Resultado */}
        {result && !isSending && (() => {
          const cfg = STATE_CONFIG[result.uiState];
          const Icon = cfg.icon;
          return (
            <div className={`flex items-start gap-2 p-3 rounded-xl border ${isDark ? cfg.containerClass : cfg.containerClass.replace('500/10', '50').replace('500/20', '100')}`}>
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? cfg.iconClass : cfg.iconClass.replace('400', '600')}`} />
              <div className="space-y-0.5">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? cfg.iconClass : cfg.iconClass.replace('400', '700')}`}>
                  {cfg.label}
                </p>
                <p className={`text-[11px] leading-relaxed ${isDark ? cfg.textClass : cfg.textClass.replace('200', '700')}`}>
                  {result.message}
                </p>
                {result.callId && (
                  <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ID: {result.callId}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

      </CardContent>
    </Card>
  );
}
