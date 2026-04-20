'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { HealthRadar } from '@/features/dashboard/components/HealthRadar';
import { ConsolidatedReading } from '@/features/dashboard/components/ConsolidatedReading';
import { subscribeToGlobalStats } from '@/features/dashboard/api/dashboard.service';

const PERIODS = ['Hoje', '7D', '30D', 'Tudo'] as const;
const ROUTES = ['A', 'B', 'C'] as const;

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState<string>('Hoje');
  const [activeRoute, setActiveRoute] = useState<string>('A');
  const [sdrData, setSdrData] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Subscribe to SDRs for the scatter chart
  useEffect(() => {
    if (!db) return;
    const unsubSdrs = onSnapshot(collection(db, 'sdrs'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSdrData(data);
    });
    return () => unsubSdrs();
  }, []);

  // Subscribe to global dashboard stats
  useEffect(() => {
    const unsub = subscribeToGlobalStats(activePeriod, (stats) => {
      setGlobalStats(stats);
      setSummaryData(stats?.leitura_consolidada || null);
    });
    return () => unsub?.();
  }, [activePeriod]);

  const sortedGaps = globalStats?.recurrent_gaps
    ? Object.entries(globalStats.recurrent_gaps)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
    : [];

  const sortedStrengths = globalStats?.top_strengths
    ? Object.entries(globalStats.top_strengths)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
    : [];

  const totalCalls = globalStats?.totalCalls ?? 0;
  const teamAverage = globalStats?.teamAverage ?? 0;
  const approvalRate = globalStats?.approvalRate ?? 0;
  const avgDuration = globalStats?.avgDuration ?? '00:00';

  return (
    <div
      className="min-h-screen w-full px-5 py-5 md:px-8 lg:px-10"
      style={{
        background: `
          radial-gradient(circle at 12% 0%, rgba(88,166,255,0.10), transparent 24%),
          radial-gradient(circle at 100% 10%, rgba(155,123,255,0.10), transparent 20%),
          radial-gradient(circle at 50% 100%, rgba(75,225,183,0.06), transparent 24%),
          linear-gradient(180deg, #07111F 0%, #0A1427 100%)
        `,
        color: '#EDF2FF',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div className="mx-auto max-w-[1520px]">

        {/* ── HEADER ── */}
        <header
          style={{
            background: 'linear-gradient(180deg, rgba(21,33,60,0.96), rgba(15,25,47,0.92))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)',
            backdropFilter: 'blur(14px)',
            borderRadius: 24,
            padding: '28px 32px',
          }}
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                Team Intelligence Hub
              </div>
              <h1 style={{ marginTop: 12, fontSize: 42, fontWeight: 600, letterSpacing: '-0.04em', color: 'white', lineHeight: 1 }}>
                Intelligence Command
              </h1>
              <p style={{ marginTop: 12, maxWidth: 760, fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.58)' }}>
                Visão macro da performance da equipe. Monitore volume, qualidade e padrões de performance em tempo real.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {['Exportar relatório', 'Atualizar dados', 'Compartilhar dashboard'].map(label => (
                <button
                  key={label}
                  style={{
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))',
                    color: 'rgba(255,255,255,0.82)',
                    borderRadius: 16,
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: '160ms ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── FILTERS ── */}
        <section
          style={{
            marginTop: 20,
            background: 'linear-gradient(180deg, rgba(17,28,51,0.94), rgba(14,23,43,0.92))',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(12px)',
            borderRadius: 22,
            padding: '20px 24px',
          }}
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.9fr]">
            <div>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
                Período
              </label>
              <div className="flex flex-wrap gap-2">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    style={{
                      borderRadius: 12,
                      padding: '10px 16px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      transition: '160ms ease',
                      background: activePeriod === p
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.08))'
                        : 'transparent',
                      color: activePeriod === p ? 'white' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
                Rota
              </label>
              <div className="flex flex-wrap gap-2">
                {ROUTES.map(r => (
                  <button
                    key={r}
                    onClick={() => setActiveRoute(r)}
                    style={{
                      borderRadius: 12,
                      padding: '10px 16px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      transition: '160ms ease',
                      background: activeRoute === r
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.08))'
                        : 'transparent',
                      color: activeRoute === r ? 'white' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── KPI CARDS ── */}
        <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {[
            {
              label: 'Total de Chamadas',
              value: totalCalls.toLocaleString('pt-BR'),
              sub: 'Chamadas processadas',
              accent: '#58A6FF',
              icon: (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-2V5Zm7-2h7a2 2 0 0 1 2 2v8h-9V3Zm0 12h9v4a2 2 0 0 1-2 2h-7v-6Z"/>
                </svg>
              ),
            },
            {
              label: 'Média SPIN',
              value: teamAverage.toFixed(1).replace('.', ','),
              sub: 'Média real das avaliações',
              bar: teamAverage / 10,
              accent: '#9B7BFF',
              icon: (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8a1 1 0 0 1 1 1v3.586l2.707 2.707-1.414 1.414L11 13.414V9a1 1 0 0 1 1-1Z"/>
                </svg>
              ),
            },
            {
              label: 'Taxa de Aprovação',
              value: `${approvalRate}%`,
              sub: 'Chamadas acima de 7.0',
              accent: '#4BE1B7',
              icon: (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm4.707 7.707-5.5 5.5a1 1 0 0 1-1.414 0l-2.5-2.5 1.414-1.414 1.793 1.793 4.793-4.793 1.414 1.414Z"/>
                </svg>
              ),
            },
            {
              label: 'Duração Média',
              value: avgDuration,
              sub: 'Conversas qualificadas',
              accent: '#F5B65D',
              icon: (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8a1 1 0 0 1 1 1v3.586l2.707 2.707-1.414 1.414L11 13.414V9a1 1 0 0 1 1-1Zm0-6a5 5 0 0 1 5 5v1.1A7.002 7.002 0 0 1 19 14a7 7 0 1 1-14 0 7.002 7.002 0 0 1 2-4.9V7a5 5 0 0 1 5-5Z"/>
                </svg>
              ),
            },
          ].map(({ label, value, sub, accent, bar, icon }) => (
            <article
              key={label}
              style={{
                background: 'linear-gradient(180deg, rgba(21,33,60,0.96), rgba(15,25,47,0.92))',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
                borderRadius: 22,
                padding: 24,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-full">
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                    {label}
                  </div>
                  <div style={{ marginTop: 20, fontSize: 56, fontWeight: 600, color: 'white', letterSpacing: '-0.06em', lineHeight: 1 }}>
                    {value}
                  </div>
                  {bar !== undefined && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.42)', marginBottom: 8 }}>
                        <span>Escala 0–10</span><span>{value} / 10</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 9999, background: 'rgba(255,255,255,0.09)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg, #58A6FF 0%, #9B7BFF 55%, #4BE1B7 100%)', width: `${(bar * 100).toFixed(0)}%` }} />
                      </div>
                    </div>
                  )}
                  <p style={{ marginTop: bar !== undefined ? 16 : 12, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.54)' }}>
                    {sub}
                  </p>
                </div>
                <div style={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 16, background: `${accent}1A`, color: accent, flexShrink: 0 }}>
                  {icon}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* ── MAIN CONTENT: Radar + Gaps/Insights ── */}
        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_0.95fr]">

          {/* Scatter Radar */}
          <article
            style={{
              background: 'linear-gradient(180deg, rgba(21,33,60,0.96), rgba(15,25,47,0.92))',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
              borderRadius: 24,
              padding: '28px',
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
                  Performance Overview
                </div>
                <h2 style={{ marginTop: 8, fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', color: 'white' }}>
                  Radar de Saúde da Equipe
                </h2>
                <p style={{ marginTop: 12, maxWidth: 640, fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.56)' }}>
                  Cada ponto representa um SDR. O eixo X mede domínio da condução e o eixo Y mede profundidade na exploração de dor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.68)' }}>
                {[['#58A6FF', 'Rota A'], ['#9B7BFF', 'Rota B'], ['#4BE1B7', 'Rota C']].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span style={{ width: 10, height: 10, borderRadius: 9999, background: color, display: 'inline-block' }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <HealthRadar data={sdrData} />
          </article>

          {/* Right column: Gaps + Insights */}
          <div className="grid gap-5">

            {/* Gaps */}
            <article
              style={{
                background: 'linear-gradient(180deg, rgba(21,33,60,0.96), rgba(15,25,47,0.92))',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
                borderRadius: 24,
                padding: '28px',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
                    Inteligência Agregada
                  </div>
                  <h3 style={{ marginTop: 8, fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: 'white' }}>
                    Gaps de Processo
                  </h3>
                </div>
                <span style={{ background: 'rgba(255,107,122,0.14)', color: '#FFB8C0', border: '1px solid rgba(255,107,122,0.22)', borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Crítico
                </span>
              </div>
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {sortedGaps.length > 0 ? sortedGaps.map(([gap, count]: any, idx) => {
                  const maxCount = (sortedGaps[0][1] as number) || 1;
                  const pct = Math.round(((count as number) / maxCount) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between gap-4">
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>{gap}</div>
                        <span style={{ background: 'rgba(255,107,122,0.14)', color: '#FFB8C0', border: '1px solid rgba(255,107,122,0.22)', borderRadius: 9999, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                          {count}x
                        </span>
                      </div>
                      <div style={{ height: 7, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 10 }}>
                        <div style={{ height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg, #FF6B7A, #FF9AA5)', width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', fontStyle: 'italic' }}>Aguardando novas análises...</p>
                )}
              </div>
            </article>

            {/* Insights */}
            <article
              style={{
                background: 'linear-gradient(180deg, rgba(21,33,60,0.96), rgba(15,25,47,0.92))',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
                borderRadius: 24,
                padding: '28px',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)' }}>
                    Strength Signals
                  </div>
                  <h3 style={{ marginTop: 8, fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: 'white' }}>
                    Pontos Fortes
                  </h3>
                </div>
                <span style={{ background: 'rgba(89,227,183,0.12)', color: '#A1F3D8', border: '1px solid rgba(89,227,183,0.2)', borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Positivo
                </span>
              </div>
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
                {sortedStrengths.length > 0 ? sortedStrengths.map(([strength, count]: any, idx) => {
                  const maxCount = (sortedStrengths[0][1] as number) || 1;
                  const pct = Math.round(((count as number) / maxCount) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between gap-4">
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>{strength}</div>
                        <span style={{ background: 'rgba(89,227,183,0.12)', color: '#A1F3D8', border: '1px solid rgba(89,227,183,0.2)', borderRadius: 9999, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                          {count}x
                        </span>
                      </div>
                      <div style={{ height: 7, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 10 }}>
                        <div style={{ height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg, #3FD9A8, #8AF0CF)', width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)', fontStyle: 'italic' }}>Aguardando novas análises...</p>
                )}
              </div>
            </article>
          </div>
        </section>

        {/* ── CONSOLIDATED READING ── */}
        <ConsolidatedReading data={summaryData} />

      </div>
    </div>
  );
}