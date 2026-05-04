'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useDashboard } from '@/context/DashboardContext';
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type WorkerState = 'idle' | 'loading' | 'success' | 'error' | 'busy';

export function Header() {
  const { isAdmin, viewingEmail, setViewingEmail, user } = useDashboard();
  const [sdrs, setSdrs] = useState<{name: string, email: string}[]>([]);
  const [workerState, setWorkerState] = useState<WorkerState>('idle');

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, 'sdr_registry'), (snap) => {
      const list = snap.docs.map(doc => ({ 
        name: doc.data().name || doc.id, 
        email: doc.data().email || doc.id 
      }));
      setSdrs(list);
    });
    return () => unsub();
  }, [isAdmin]);

  const handleRunWorker = async () => {
    if (workerState === 'loading') return;
    setWorkerState('loading');

    try {
      const rawUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const baseUrl = rawUrl.replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/worker/run`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.status === 200) {
        setWorkerState('success');
      } else if (res.status === 409) {
        setWorkerState('busy');
      } else {
        setWorkerState('error');
      }
    } catch {
      setWorkerState('error');
    } finally {
      // Volta ao estado idle após 3s
      setTimeout(() => setWorkerState('idle'), 3000);
    }
  };

  const workerButtonConfig = {
    idle:    { label: 'Rodar Worker', icon: <Zap className="w-3.5 h-3.5" />, cls: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/40 hover:text-white' },
    loading: { label: 'Iniciando...', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, cls: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 cursor-not-allowed' },
    success: { label: 'Iniciado!',   icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-emerald-600/20 border-emerald-500/30 text-emerald-300' },
    busy:    { label: 'Em execução', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, cls: 'bg-amber-600/20 border-amber-500/30 text-amber-300' },
    error:   { label: 'Erro',        icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'bg-red-600/20 border-red-500/30 text-red-300' },
  }[workerState];

  if (!isAdmin) {
    return (
      <header className="flex items-center justify-between p-4 bg-panel border-b border-white/5">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-white/70">Olá, {user?.name || 'Usuário'}</div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between p-4 bg-panel border-b border-white/5">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>
      <div className="flex items-center gap-3">
        {/* Botão de trigger manual do Worker */}
        <button
          onClick={handleRunWorker}
          disabled={workerState === 'loading' || workerState === 'busy'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${workerButtonConfig.cls}`}
        >
          {workerButtonConfig.icon}
          {workerButtonConfig.label}
        </button>

        {/* Seletor de impersonação de SDR */}
        <div className="flex items-center gap-4 bg-panel/50 p-2 rounded-xl border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple">Simular SDR:</span>
          <select 
            value={viewingEmail || ''} 
            onChange={(e) => {
              const val = e.target.value;
              setViewingEmail(val || null);
            }}
            className="bg-bg border-none text-xs font-semibold text-white focus:ring-0 rounded-lg cursor-pointer"
          >
            <option value="">Minha Visão (Admin)</option>
            {sdrs.map(sdr => (
              <option key={sdr.email} value={sdr.email}>{sdr.name}</option>
            ))}
          </select>
          {viewingEmail && (
            <button 
              onClick={() => setViewingEmail(null)}
              className="text-red hover:text-white text-xs font-bold px-2"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-white/70">Olá, {user?.name || 'Usuário'}</div>
      </div>
    </header>
  );
}
