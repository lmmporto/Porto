'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';

const AVAILABLE_TEAMS = ["Time Alex", "Time Sabrina", "Time Lenini", "Time William", "Time Lucas", "Time Amanda"];

export default function SettingsPage() {
  const { isAdmin } = useDashboard();
  const [sdrs, setSdrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

  useEffect(() => {
    if (isAdmin) {
      // Garantindo a URL completa com o prefixo /api
      const fullUrl = `${API_URL}/api/sdr-registry`;

      fetch(fullUrl, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          const list = Array.isArray(data) ? data : (data.sdrs || []);
          setSdrs(list);
          setLoading(false);
        })
        .catch(err => {
          console.error("Erro ao buscar SDRs:", err);
          setLoading(false);
        });
    }
  }, [isAdmin, API_URL]);

  const updateTeam = async (sdr: any, assignedTeam: string) => {
    const sdrId = sdr.id || sdr.email;
    console.log("📡 Enviando para API:", { sdrId, assignedTeam });
    
    if (!sdrId) {
      console.error("Erro: ID do SDR não encontrado no objeto:", sdr);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/sdr-registry/update-sdr`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdrId, assignedTeam }),
        credentials: 'include'
      });
      
      if (res.ok) {
        // Atualiza a lista localmente para refletir a mudança na UI imediatamente
        setSdrs(prev => prev.map(s => (s.id === sdrId || s.email === sdrId) ? { ...s, assignedTeam } : s));
        alert('Time atualizado com sucesso!');
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Erro do servidor:", err);
        alert('Erro ao atualizar. Verifique o console.');
      }
    } catch (err) {
      console.error("Erro na rede:", err);
      alert('Erro na comunicação com o servidor');
    }
  };

  if (!isAdmin) return <div className="p-8 text-white">Acesso negado.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="glass-card p-8 rounded-[24px] border border-white/5 shadow-2xl">
        <h1 className="text-[32px] font-bold text-white mb-8 tracking-tight">Configurações de Times</h1>
        
        {loading ? (
          <div className="text-white/40">Carregando registro de SDRs...</div>
        ) : (
          <div className="space-y-4">
            {sdrs.map((sdr, index) => (
              <div key={sdr.id || sdr.email || index} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex flex-col">
                  <span className="text-[16px] font-semibold text-white">{sdr.name || sdr.email}</span>
                  <span className="text-[12px] text-white/40">{sdr.email}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <select 
                    key={sdr.assignedTeam}
                    className="bg-[#0A1630] text-white border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                    value={sdr.assignedTeam || 'Time Alex'} 
                    onChange={(e) => updateTeam(sdr, e.target.value)}
                  >
                    {AVAILABLE_TEAMS.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
