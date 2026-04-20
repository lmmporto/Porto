'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useDashboard } from '@/context/DashboardContext';

export function Header() {
  const { isAdmin, viewingEmail, setViewingEmail, user } = useDashboard();
  const [sdrs, setSdrs] = useState<{name: string, email: string}[]>([]);

  useEffect(() => {
    if (!isAdmin) return; // Só busca SDRs se for admin
    const unsub = onSnapshot(collection(db, 'sdr_registry'), (snap) => {
      console.log("👥 SDRs carregados no Header:", snap.docs.length);
      const list = snap.docs.map(doc => ({ 
        name: doc.data().name || doc.id, 
        email: doc.data().email || doc.id 
      }));
      setSdrs(list);
    });
    return () => unsub();
  }, [isAdmin]);

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
      <div className="flex items-center gap-4">
        {isAdmin && ( // Renderiza o seletor usando a autorização provida pelo backend
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
        )}
        <div className="text-white/70">Olá, {user?.name || 'Usuário'}</div>
      </div>
    </header>
  );
}
