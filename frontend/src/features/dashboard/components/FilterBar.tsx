'use client';

import React from 'react';

interface FilterBarProps {
  filters: {
    period: string;
    route: string;
    team: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    period: string;
    route: string;
    team: string;
  }>>;
}

export function FilterBar({ filters, setFilters }: FilterBarProps) {
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, period: e.target.value }));
  };

  const handleRouteChange = (route: string) => {
    setFilters(prev => ({ ...prev, route }));
  };

  return (
    <section className="glass-soft mt-5 rounded-[22px] p-5 md:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Período */}
        <div>
          <label htmlFor="periodSelect" className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Período
          </label>
          <div className="relative">
            <select
              id="periodSelect"
              value={filters.period}
              onChange={handlePeriodChange}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-[#0A1630] px-4 py-3.5 pr-12 text-[14px] font-medium text-white outline-none transition hover:bg-[#0A1630]/90 focus:ring-2 focus:ring-primary"
            >
              <option value="Tudo">Todo o período</option>
              <option value="Hoje">Hoje</option>
              <option value="7D">Últimos 7 dias</option>
              <option value="30D">Últimos 30 dias</option>
            </select>
            <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>

        {/* Equipe */}
        <div>
          <label htmlFor="teamSelect" className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Equipe
          </label>
          <div className="relative">
            <select
              id="teamSelect"
              value={filters.team}
              onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-[#0A1630] px-4 py-3.5 pr-12 text-[14px] font-medium text-white outline-none transition hover:bg-[#0A1630]/90 focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos os squads</option>
              <option value="Time Lucas">Time Lucas</option>
              <option value="Time William">Time William</option>
              <option value="Equipe Alex">Equipe Alex</option>
              <option value="Time Amanda">Time Amanda</option>
            </select>
            <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>

        {/* Rota */}
        <div>
          <label className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Rota
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className={`${filters.route === 'all' ? 'filter-pill-active' : 'filter-pill'} rounded-xl px-4 py-2.5 text-[14px] font-semibold`}
              onClick={() => handleRouteChange('all')}
            >
              Todas
            </button>
            <button
              className={`${filters.route === 'A' ? 'filter-pill-active' : 'filter-pill'} rounded-xl px-4 py-2.5 text-[14px] font-semibold`}
              onClick={() => handleRouteChange('A')}
            >
              Rota A
            </button>
            <button
              className={`${filters.route === 'B' ? 'filter-pill-active' : 'filter-pill'} rounded-xl px-4 py-2.5 text-[14px] font-semibold`}
              onClick={() => handleRouteChange('B')}
            >
              Rota B
            </button>
            <button
              className={`${filters.route === 'C' ? 'filter-pill-active' : 'filter-pill'} rounded-xl px-4 py-2.5 text-[14px] font-semibold`}
              onClick={() => handleRouteChange('C')}
            >
              Rota C
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
