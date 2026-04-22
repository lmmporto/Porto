'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { formatEmailToSdrId } from '@/lib/utils';
import { useDashboard } from '@/context/DashboardContext';
import { FilterBar } from '@/features/dashboard/components/FilterBar';
import { useRouter } from 'next/navigation';

interface SdrProfilePanelProps {
  sdrId: string; // Recebe o email puro
}

const getPriorityContent = (gaps: any[] | undefined, insights: any[] | undefined, hasPerformance: boolean) => {
  if (!hasPerformance) {
    return {
      mainGoal: 'N/A: Sem Histórico',
      targetBehavior: 'Inicie suas chamadas',
      playbook: [
        { title: 'Nenhuma análise de IA disponível para este período.', description: 'O radar será ativado logo após o processamento da sua primeira chamada validada.' }
      ],
      cognitiveInsight: 'O motor aguarda primeira chamada.',
      behavioralSignal: 'Aguardando ligações',
      executiveSummary: 'Você ainda não possui métricas ativas ou seu volume de chamadas não gerou massa de dados para o Flight Deck.'
    };
  }

  // Se recurrent_gaps existir e for um array com itens, usa o primeiro
  if (Array.isArray(gaps) && gaps.length > 0) {
    const topGap = gaps[0];
    const cognitiveInsight = insights?.find(i => i.label === 'Ponto Cego Identificado')?.value || `O SDR tende a ${topGap.label?.toLowerCase() || 'apresentar falhas'} em algumas chamadas.`;
    const behavioralSignal = insights?.find(i => i.label === 'Sinal Comportamental')?.value || `Foco em ${topGap.label?.toLowerCase() || 'melhoria'}.`;
    const executiveSummary = insights?.find(i => i.label === 'Resumo Executivo')?.value || `O principal ponto de melhoria é ${topGap.label?.toLowerCase() || 'o processo de venda'}.`;

    return {
      mainGoal: topGap.label || 'Melhorar Processo',
      targetBehavior: topGap.value || 'Seguir melhores práticas',
      playbook: [], // Será substituído pelos dados da call no componente
      cognitiveInsight,
      behavioralSignal,
      executiveSummary
    };
  }

  // Fallback quando não há gaps identificados
  return {
    mainGoal: 'Sem gaps detectados',
    targetBehavior: 'Consistência na execução',
    playbook: [
      { title: '1. Mantenha o ritmo', description: 'Continue com a alta performance.' },
      { title: '2. Revise sucessos', description: 'Entenda o que funciona e replique.' },
    ],
    cognitiveInsight: 'Nenhum ponto cego identificado. Continue o bom trabalho!',
    behavioralSignal: 'Execução dentro do padrão esperado.',
    executiveSummary: 'Aguardando mais análises para gerar um resumo executivo.'
  };
};


export function SdrProfilePanel({ sdrId }: SdrProfilePanelProps) {
  const { user } = useDashboard();
  const router = useRouter();
  const [sdrData, setSdrData] = useState<any>(null);
  const [priorityCalls, setPriorityCalls] = useState<any[]>([]);
  const [allCalls, setAllCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'Tudo', route: 'all', team: 'all' });
  const [isHistoryOverlayOpen, setIsHistoryOverlayOpen] = useState(false); // Estado para o overlay de histórico
  const [historyPeriod, setHistoryPeriod] = useState('Tudo'); // Estado para o filtro do histórico
  const [currentPage, setCurrentPage] = useState(1);

  if (sdrId === 'lucas_porto@nibo_com_br' || sdrId === 'lucas.porto@nibo.com.br') {
    router.push('/dashboard');
    return null;
  }

  // Sincronização de Impersonate: Reseta filtros ao trocar de SDR
  useEffect(() => {
    setFilters({ period: 'Tudo', route: 'all' });
  }, [sdrId]);

  useEffect(() => {
    if (!sdrId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const cleanId = formatEmailToSdrId(sdrId);
    let unsubPerf = () => {};

    const unsubRegistry = onSnapshot(doc(db, 'sdr_registry', cleanId), (regSnap) => {
      const basicData = regSnap.exists() ? regSnap.data() : { name: sdrId, email: sdrId, cleanId };
      
      unsubPerf = onSnapshot(doc(db, 'sdrs', cleanId), (perfSnap) => {
        if (perfSnap.exists()) {
          const data = perfSnap.data();
          console.log("📊 DADOS DO SDR NO FIREBASE:", data);
          setSdrData({ ...basicData, ...data, hasPerformance: true });
        } else {
          console.warn(`SDR sem dados de performance em 'sdrs' para o ID: ${cleanId}`);
          setSdrData({ ...basicData, hasPerformance: false });
        }
      });
    });

    return () => {
      unsubRegistry();
      unsubPerf();
    };
  }, [sdrId]);

  // Efeito para Histórico (Snapshot de 50 itens + Paginação Frontend)
  useEffect(() => {
    if (!sdrData || !sdrData.email) {
      setAllCalls([]);
      return;
    }

    const sdrEmail = sdrData.email;
    const callsRef = collection(db, 'calls_analysis');
    
    let historyConstraints = [
      where('ownerEmail', '==', sdrEmail)
    ];

    if (historyPeriod !== 'Tudo') {
      const now = new Date();
      let startDate = new Date();
      if (historyPeriod === 'Hoje') startDate.setHours(0,0,0,0);
      if (historyPeriod === '7D') startDate.setDate(now.getDate() - 7);
      if (historyPeriod === '30D') startDate.setDate(now.getDate() - 30);
      historyConstraints.push(where('createdAt', '>=', startDate));
    }

    const qAll = query(
      callsRef,
      ...historyConstraints,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubAllCalls = onSnapshot(qAll, (querySnapshot) => {
      const calls = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllCalls(calls);
      setCurrentPage(1); // Reseta para pág 1 ao mudar filtro
    });

    return () => unsubAllCalls();
  }, [sdrData, historyPeriod]);

  // Paginação no Frontend
  const paginatedCalls = allCalls.slice((currentPage - 1) * 10, currentPage * 10);

  useEffect(() => {
    if (!sdrData || !sdrData.email) {
      setPriorityCalls([]);
      return;
    }

    const sdrEmail = sdrData.email;
    const callsRef = collection(db, 'calls_analysis');
    
    let constraints = [
      where('ownerEmail', '==', sdrEmail),
      where('status_final', '!=', 'APROVADO')
    ];

    if (filters.route !== 'all') {
      constraints.push(where('rota', '==', filters.route));
    }

    if (filters.period !== 'Tudo') {
      const now = new Date();
      let startDate = new Date();
      if (filters.period === 'Hoje') startDate.setHours(0,0,0,0);
      if (filters.period === '7D') startDate.setDate(now.getDate() - 7);
      if (filters.period === '30D') startDate.setDate(now.getDate() - 30);
      constraints.push(where('createdAt', '>=', startDate));
    }

    const qPriority = query(
      callsRef,
      ...constraints,
      orderBy('status_final'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubPriorityCalls = onSnapshot(qPriority, 
      (querySnapshot) => {
        const calls = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPriorityCalls(calls);
        setLoading(false);
      },
      (error) => {
        if (error.code === 'failed-precondition') {
          console.warn("⚠️ Erro de Índice: Clique no link do log para autorizar a query no Firestore");
        }
        console.error("Erro ao buscar chamadas prioritárias:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubPriorityCalls();
    };
  }, [sdrData, filters]);


  if (loading) return <div className="flex h-screen items-center justify-center text-soft">Carregando Flight Deck...</div>;
  const priorityContent = getPriorityContent(sdrData?.recurrent_gaps, sdrData?.insights_estrategicos, !!sdrData?.hasPerformance);

  return (
    <>
      {/* INJECTED GLOBAL STYLES FROM ORIGINAL HTML */}
      <style jsx global>{`
        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          background:
            radial-gradient(circle at 0% 0%, rgba(124,114,255,0.10), transparent 22%),
            radial-gradient(circle at 100% 0%, rgba(255,122,26,0.08), transparent 18%),
            radial-gradient(circle at 50% 100%, rgba(53,211,154,0.05), transparent 22%),
            linear-gradient(180deg, #020817 0%, #041024 100%);
          color: #EDF4FF;
        }

        .glass {
          background: linear-gradient(180deg, rgba(13,27,55,0.96), rgba(8,21,42,0.96));
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow:
            0 18px 50px rgba(0,0,0,0.36),
            inset 0 1px 0 rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .glass-soft {
          background: linear-gradient(180deg, rgba(11,23,46,0.95), rgba(7,18,37,0.95));
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 10px 30px rgba(0,0,0,0.28);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .primary-nav-btn {
          background: linear-gradient(180deg, rgba(124,114,255,0.20), rgba(124,114,255,0.10));
          border: 1px solid rgba(124,114,255,0.28);
          color: #D5D1FF;
          box-shadow: 0 8px 24px rgba(124,114,255,0.10);
        }

        .secondary-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.82);
        }

        .secondary-btn:hover,
        .primary-nav-btn:hover {
          transform: translateY(-1px);
        }

        .tiny-caps {
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .pill-green {
          background: linear-gradient(180deg, rgba(53,211,154,0.18), rgba(53,211,154,0.10));
          border: 1px solid rgba(53,211,154,0.28);
          color: #9AF4D3;
        }

        .metric-value {
          letter-spacing: -0.06em;
          line-height: 1;
        }

        .kpi-card {
          background: linear-gradient(180deg, rgba(17,33,63,0.96), rgba(11,24,46,0.96));
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 10px 28px rgba(0,0,0,0.22);
        }

        .review-hero {
          border: 1px solid rgba(255,255,255,0.08);
          background:
            radial-gradient(circle at top left, rgba(124,114,255,0.10), transparent 24%),
            linear-gradient(180deg, rgba(12,26,52,0.98), rgba(8,21,42,0.98));
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 18px 60px rgba(124,114,255,0.10);
        }

        .call-item {
          transition: 180ms ease;
          border: 1px solid rgba(255,255,255,0.12);
          background: linear-gradient(180deg, rgba(22,37,68,0.78), rgba(15,28,53,0.78));
        }

        .call-item:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.20);
          box-shadow:
            0 0 0 1px rgba(124,114,255,0.10),
            0 16px 40px rgba(0,0,0,0.28);
        }

        .call-item-primary {
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05),
            0 18px 40px rgba(124,114,255,0.10);
        }

        .badge-danger {
          background: rgba(255,110,122,0.12);
          color: #FFB0B6;
          border: 1px solid rgba(255,110,122,0.22);
        }

        .badge-warning {
          background: rgba(244,180,95,0.12);
          color: #FFD193;
          border: 1px solid rgba(244,180,95,0.22);
        }

        .badge-purple {
          background: rgba(124,114,255,0.14);
          color: #D5D1FF;
          border: 1px solid rgba(124,114,255,0.22);
        }

        .icon-box {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .icon-purple {
          background: rgba(124,114,255,0.14);
          color: #B8B2FF;
          border: 1px solid rgba(124,114,255,0.2);
        }

        .icon-orange {
          background: rgba(255,122,26,0.14);
          color: #FFAE72;
          border: 1px solid rgba(255,122,26,0.2);
        }

        .icon-green {
          background: rgba(53,211,154,0.14);
          color: #9AF4D3;
          border: 1px solid rgba(53,211,154,0.2);
        }

        .section-dot {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          display: inline-block;
          background: #7C72FF;
          box-shadow: 0 0 14px rgba(124,114,255,0.42);
        }

        .section-dot-orange {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          display: inline-block;
          background: #FF7A1A;
          box-shadow: 0 0 14px rgba(255,122,26,0.42);
        }

        .bar-track {
          height: 7px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .bar-danger {
          background: linear-gradient(90deg, #FF7C84, #FFB0B6);
        }

        .bar-warning {
          background: linear-gradient(90deg, #FF9A49, #FFC27E);
        }

        .bar-success {
          background: linear-gradient(90deg, #39D98A, #8EF0C6);
        }

        .progress-track {
          height: 8px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .progress-fill-orange {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #FF7A1A, #FFAF6F);
        }

        .progress-fill-green {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #35D39A, #8AF0CB);
        }

        .progress-fill-purple {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #7C72FF, #B5AFFF);
        }

        .summary-card {
          background:
            radial-gradient(circle at top left, rgba(124,114,255,0.08), transparent 22%),
            radial-gradient(circle at top right, rgba(255,122,26,0.06), transparent 18%),
            linear-gradient(180deg, rgba(14,28,55,0.96), rgba(9,20,39,0.95));
        }

        .history-overlay {
          background: rgba(1, 5, 14, 0.74);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .history-modal {
          background: linear-gradient(180deg, rgba(12,26,52,0.98), rgba(8,21,42,0.98));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 24px 70px rgba(0,0,0,0.42);
        }

        .history-row {
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .history-row:last-child {
          border-bottom: none;
        }
      `}</style>

      <div className="mx-auto max-w-[1460px] px-4 py-4 sm:px-6 lg:px-8 w-full h-auto">
        {/* HEADER */}
        <header className="glass rounded-[24px] px-5 py-5 md:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-[linear-gradient(135deg,#7C72FF,#182A56)] p-[2px] shadow-glow">
                  {user?.picture ? (
                    <img src={user.picture} alt={sdrData.name?.charAt(0) || 'S'} className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0A1630] text-lg font-bold text-white">
                      {sdrData.name?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                {sdrData.ranking_score > 8 && (
                  <span className="pill-green absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                    Top Performer
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white md:text-[34px]">
                  {sdrData.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/42">
                  <span>{sdrData.teamName || 'Time Enterprise'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsHistoryOverlayOpen(true)}
                className="primary-nav-btn rounded-2xl px-4 py-3 text-[13px] font-semibold transition"
              >
                Histórico de Ligações
              </button>
              {/* Botões 'Exportar' e 'Atualizar análise' removidos */}
            </div>
          </div>
        </header>

        {/* FilterBar */}
        <FilterBar filters={filters} setFilters={setFilters} />

        {/* KPIs */}
        <section className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <article className="kpi-card rounded-[20px] p-5">
            <div className="tiny-caps text-[11px] font-semibold text-white/38">Nota SPIN</div>
            <div className="metric-value mt-4 text-[42px] font-semibold text-green2">{sdrData.real_average?.toFixed(1) || '0.0'}</div>
          </article>

          <article className="kpi-card rounded-[20px] p-5">
            <div className="tiny-caps text-[11px] font-semibold text-white/38">Ranking Turbo</div>
            <div className="metric-value mt-4 text-[42px] font-semibold text-yellow">{sdrData.ranking_score?.toFixed(1) || '0.0'}</div>
          </article>

          <article className="kpi-card rounded-[20px] p-5">
            <div className="tiny-caps text-[11px] font-semibold text-white/38">Exploração de Dor</div>
            <div className="metric-value mt-4 text-[42px] font-semibold text-purple2">
              {sdrData.media_dor > 0 ? Math.round(sdrData.media_dor * 10) + '%' : 'N/A'}
            </div>
          </article>

          <article className="kpi-card rounded-[20px] p-5">
            <div className="tiny-caps text-[11px] font-semibold text-white/38">Controle da Call</div>
            <div className="metric-value mt-4 text-[42px] font-semibold text-white">
              {sdrData.media_dominio > 0 ? Math.round(sdrData.media_dominio * 10) + '%' : 'N/A'}
            </div>
          </article>
        </section>

        {/* MAIN */}
        <main className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          {/* ESQUERDA: CALLS */}
          <section>
            <article className="review-hero rounded-[28px] p-6 md:p-7 lg:p-8 min-h-[500px]">
              <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-[760px]">
                  <div className="flex items-center gap-3">
                    <span className="section-dot"></span>
                    <span className="tiny-caps text-[11px] font-semibold text-white/40">3. Quais calls preciso revisar agora?</span>
                  </div>

                  <h2 className="mt-4 text-[30px] font-semibold tracking-[-0.04em] text-white md:text-[40px]">
                    Calls Prioritárias para Revisão
                  </h2>

                  <p className="mt-3 text-[15px] leading-8 text-white/66">
                    Chamadas onde houve comportamento crítico detectado. Essa é a principal área operacional da tela.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {priorityCalls.length > 0 ? priorityCalls.map(call => (
                  <article key={call.id} className="call-item rounded-[18px] p-4 border border-[#7C72FF]/30 shadow-[0_0_15px_rgba(255,110,122,0.15)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[16px] font-semibold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                            {call.nome_do_lead || call.title || call.call_title || 'Chamada Analisada'}
                          </h3>
                          <span className="badge-danger rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">{call.status_final}</span>
                        </div>
                        <div className="mt-1 flex gap-3 text-[12px] text-white/40">
                          <span>Score: {call.nota_spin?.toFixed(1)}</span>
                          <span>•</span>
                          <span>{call.createdAt ? new Date(call.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <Link href={`/dashboard/calls/${call.id}`} className="secondary-btn rounded-xl px-4 py-2 text-[12px] font-semibold text-center whitespace-nowrap">
                        Revisar Call
                      </Link>
                    </div>
                  </article>
                )) : (
                  <div className="text-center py-10 text-white/30">
                    {!sdrData?.hasPerformance ? 'Aguardando processamento da primeira chamada...' : 'Nenhuma chamada prioritária encontrada. Bom trabalho!'}
                  </div>
                )}
              </div>
            </article>
          </section>

          {/* DIREITA */}
          <aside className="space-y-5">
            {/* PRIORIDADE */}
            <article className="glass rounded-[24px] p-5 md:p-6">
              <div className="flex items-center gap-3">
                <span className="section-dot-orange"></span>
                <div>
                  <div className="tiny-caps text-[11px] font-semibold text-white/40">4. Como melhorar na próxima call?</div>
                  <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
                    Prioridade de Execução
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[18px] border border-orange/20 bg-orange/10 p-4" style={{ borderColor: '#FF7A1A', backgroundColor: 'rgba(255,122,26,0.1)' }}>
                  <div className="tiny-caps text-[11px] font-semibold text-white/40">Objetivo principal</div>
                  <div className="mt-2 text-[20px] font-semibold text-white">{priorityContent.mainGoal || 'Análise em processamento...'}</div>
                </div>

                <div className="rounded-[18px] border border-purple/20 bg-purple/10 p-4">
                  <div className="tiny-caps text-[11px] font-semibold text-white/40">Comportamento alvo</div>
                  <div className="mt-2 text-[20px] font-semibold text-white">{priorityContent.targetBehavior || 'Análise em processamento...'}</div>
                </div>

                <div className="rounded-[18px] border border-green/20 bg-green/10 p-4">
                  <div className="tiny-caps text-[11px] font-semibold text-white/40">Ganho esperado</div>
                  <div className="mt-2 text-[20px] font-semibold text-white">Mais avanço qualificado</div>
                </div>
              </div>
            </article>

            {/* PLAYBOOK */}
            <article className="glass rounded-[24px] p-5 md:p-6">
              <div className="flex items-center gap-3">
                <span className="section-dot"></span>
                <div>
                  <div className="tiny-caps text-[11px] font-semibold text-white/40">Playbook recomendado</div>
                  <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
                    {allCalls?.[0]?.playbook_detalhado ? 'Ações Recomendadas' : (priorityContent.playbook[0]?.title || 'Playbook Geral')}
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {!allCalls || allCalls.length === 0 ? (
                  <div className="text-white/30 text-sm py-4">Aguardando dados da última chamada...</div>
                ) : (
                  Array.isArray(allCalls[0].playbook_detalhado) && allCalls[0].playbook_detalhado.length > 0 ? (
                    allCalls[0].playbook_detalhado.map((step: any, index: number) => {
                      // Tipagem Flexível: Suporta objeto {diagnostico, recomendacao} ou item legado
                      const title = typeof step === 'object' ? step.diagnostico : `Ação ${index + 1}`;
                      const description = typeof step === 'object' ? step.recomendacao : step;
                      
                      return (
                        <div key={index} className="rounded-[18px] border border-[#7C72FF]/40 bg-[#7C72FF]/5 p-4 shadow-[0_0_15px_rgba(124,114,255,0.15)]">
                          <div className="text-[16px] font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                            {title || 'Sem recomendação disponível'}
                          </div>
                          <p className="mt-2 text-[14px] leading-7 text-white/80">
                            {description || 'Sem recomendação disponível'}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    priorityContent.playbook.map((step, index) => (
                      <div key={index} className="rounded-[18px] border border-[#7C72FF]/40 bg-[#7C72FF]/5 p-4 shadow-[0_0_15px_rgba(124,114,255,0.15)]">
                        <div className="text-[16px] font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{step.title}</div>
                        <p className="mt-2 text-[14px] leading-7 text-white/80">
                          {step.description}
                        </p>
                      </div>
                    ))
                  )
                )}
              </div>
            </article>
          </aside>
        </main>

        {/* DIAGNÓSTICO */}
        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <article className="summary-card rounded-[24px] border border-white/8 p-5 md:p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="section-dot"></span>
              <div>
                <div className="tiny-caps text-[11px] font-semibold text-white/40">1. Como estou performando?</div>
                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
                  Resumo de Performance
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px] font-medium text-white/62">
                  <span>Exploração de Dor</span>
                  <span>{sdrData.media_dor > 0 ? Math.round(sdrData.media_dor * 10) + '%' : 'N/A'}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill-purple h-full rounded-full" style={{ width: `${Math.round((Number(sdrData.media_dor) || 0) * 10)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[13px] font-medium text-white/62">
                  <span>Controle da Call</span>
                  <span>{sdrData.media_dominio > 0 ? Math.round(sdrData.media_dominio * 10) + '%' : 'N/A'}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill-green h-full rounded-full" style={{ width: `${Math.round((Number(sdrData.media_dominio) || 0) * 10)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[13px] font-medium text-white/62">
                  <span>Próximo Passo</span>
                  <span>{sdrData.next_step_score > 0 ? Math.round(sdrData.next_step_score * 10) + '%' : 'N/A'}</span> {/* Placeholder ou campo real */}
                </div>
                <div className="progress-track">
                  <div className="progress-fill-orange h-full rounded-full" style={{ width: `${Math.round((sdrData.next_step_score || 0) * 10)}%` }}></div>
                </div>
              </div>
            </div>
          </article>

          <article className="glass rounded-[24px] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="section-dot-orange"></span>
              <div>
                <div className="tiny-caps text-[11px] font-semibold text-white/40">2. Onde estou errando?</div>
                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
                  Gaps Detectados
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {sdrData.recurrent_gaps && (Array.isArray(sdrData.recurrent_gaps) ? sdrData.recurrent_gaps.length > 0 : Object.entries(sdrData.recurrent_gaps).length > 0) ? (
                Array.isArray(sdrData.recurrent_gaps) ? (
                  sdrData.recurrent_gaps.map((gap: any, index: number) => (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-[14px] font-medium text-white/76">{gap.label}</span>
                        <span className="text-[13px] font-semibold text-red2">{gap.count || gap.value || 0}x</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-danger h-full rounded-full" style={{ width: `${Math.min((Number(gap.count || gap.value || 0)) * 10, 100)}%` }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  Object.entries(sdrData.recurrent_gaps).map(([gap, count]) => (
                    <div key={gap}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-[14px] font-medium text-white/76">{gap}</span>
                        <span className="text-[13px] font-semibold text-red2">{count as number}x</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-danger h-full rounded-full" style={{ width: `${Math.min((count as number) * 10, 100)}%` }}></div>
                      </div>
                    </div>
                  ))
                )
              ) : <p className="text-white/50 text-sm">Nenhum gap recorrente detectado.</p>}
            </div>
          </article>
        </section>

        {/* FINAL */}
        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <article className="glass rounded-[24px] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="icon-box icon-purple">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m13 2-2 9h5l-5 11 2-9H8l5-11Z"/>
                </svg>
              </div>
              <div>
                <div className="tiny-caps text-[11px] font-semibold text-white/40">5. Insight cognitivo</div>
                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
                  Ponto Cego Identificado
                </h2>
              </div>
            </div>

            <p className="mt-6 text-[14px] leading-8 text-white/66">
              {priorityContent.cognitiveInsight}
            </p>

            <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="tiny-caps text-[11px] font-semibold text-white/40">Sinal comportamental</div>
              <p className="mt-2 text-[14px] leading-7 text-white/62">
                {priorityContent.behavioralSignal}
              </p>
            </div>
          </article>

          <article className="summary-card rounded-[24px] border border-white/8 p-5 md:p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="section-dot"></span>
                <div>
                  <div className="tiny-caps text-[11px] font-semibold text-white/40">6. Evolução Semanal</div>
                  <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-white">
                    Comparativo de Desempenho
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-[14px] leading-8 text-white/68 border-b border-white/10 pb-4 mb-4">
                {sdrData.evolucao_narrativa || 'Aguardando processamento de ciclo para gerar análise evolutiva...'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sdrData.melhorias && sdrData.melhorias.length > 0 && (
                  <div>
                    <strong className="text-[11px] uppercase tracking-widest text-green2">Melhorias:</strong>
                    <ul className="mt-2 space-y-1 text-sm text-white/70 list-disc list-inside">
                      {sdrData.melhorias.map((m: string, i: number) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}

                {sdrData.atencao && sdrData.atencao.length > 0 && (
                  <div>
                    <strong className="text-[11px] uppercase tracking-widest text-red2">Atenção:</strong>
                    <ul className="mt-2 space-y-1 text-sm text-white/70 list-disc list-inside">
                      {sdrData.atencao.map((a: string, i: number) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {sdrData.nota_anterior !== undefined && (
              <div className="mt-6 flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Ciclo Passado</div>
                  <div className="text-xl font-bold text-white/60">{Number(sdrData.nota_anterior).toFixed(1)}</div>
                </div>
                <div className="text-white/30 text-xl font-bold">➔</div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-green2">Ciclo Atual</div>
                  <div className="text-xl font-bold text-green2">{sdrData.real_average?.toFixed(1) || '0.0'}</div>
                </div>
              </div>
            )}
          </article>
        </section>

        {/* HISTÓRICO DE LIGAÇÕES OVERLAY */}
        {isHistoryOverlayOpen && (
          <div
            id="historyOverlay"
            className="history-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          >
            <div className="history-modal w-full max-w-[1200px] rounded-[28px] p-6 md:p-7">
              <div className="flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="tiny-caps text-[11px] font-semibold text-white/40">Histórico</div>
                  <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-white">
                    Histórico de Calls
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={historyPeriod} 
                    onChange={(e) => setHistoryPeriod(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[13px] text-white/70 outline-none focus:border-[#7C72FF]/40 transition appearance-none cursor-pointer hover:bg-white/10"
                    style={{ minWidth: '100px' }}
                  >
                    <option value="Hoje" className="bg-[#0A1630]">Hoje</option>
                    <option value="7D" className="bg-[#0A1630]">7D</option>
                    <option value="30D" className="bg-[#0A1630]">30D</option>
                    <option value="Tudo" className="bg-[#0A1630]">Tudo</option>
                  </select>

                  <button
                    onClick={() => setIsHistoryOverlayOpen(false)}
                    className="secondary-btn rounded-2xl px-4 py-3 text-[13px] font-semibold transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[20px] border border-white/8">
                <div className="grid grid-cols-[1fr_1.6fr_0.8fr_0.8fr_1fr_1.2fr_0.8fr] bg-white/[0.04] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  <div>Data</div>
                  <div>Lead</div>
                  <div>Duração</div>
                  <div>Score SPIN</div>
                  <div>Resultado</div>
                  <div>Insights</div>
                  <div>Revisar</div>
                </div>

                <div className="bg-white/[0.02] max-h-[400px] overflow-y-auto custom-scrollbar">
                  {paginatedCalls.length > 0 ? paginatedCalls.map(call => (
                    <div key={call.id} className="history-row grid grid-cols-[1fr_1.6fr_0.8fr_0.8fr_1fr_1.2fr_0.8fr] items-center px-5 py-4 text-[14px] text-white/76">
                      <div>{call.createdAt ? new Date(call.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                      <div>{call.call_title || 'Sem título'}</div>
                      <div>{call.duration ? `${Math.round(call.duration / 60000)}min` : 'N/A'}</div>
                      <div>{call.nota_spin?.toFixed(1) || 'N/A'}</div>
                      <div className={call.status_final === 'APROVADO' ? 'text-green2' : 'text-red2'}>{call.status_final || 'N/A'}</div>
                      <div className="text-white/56">{call.resumo?.substring(0, 30) || 'N/A'}</div>
                      <div>
                        <Link href={`/dashboard/calls/${call.id}`} className="secondary-btn rounded-xl px-3 py-2 text-[12px] font-semibold">
                          Revisar
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-white/30">Nenhuma chamada no histórico.</div>
                  )}
                </div>
              </div>

              {/* RODAPÉ DA TABELA: CONTROLE DE PAGINAÇÃO */}
              <div className="mt-4 flex items-center justify-between border-t border-white/8 bg-white/[0.04] px-6 py-4 rounded-b-[20px]">
                <div className="text-[12px] text-white/40">
                  Página <span className="text-white/70 font-semibold">{currentPage}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="secondary-btn rounded-xl px-4 py-2 text-[12px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    &lt; Voltar
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * 10 >= allCalls.length}
                    className="secondary-btn rounded-xl px-4 py-2 text-[12px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    Próximo &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}