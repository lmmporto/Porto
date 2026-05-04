import { SDRCall, StatusFinal } from '@/types';

/**
 * 📅 VALIDAÇÃO DE PERÍODO (FILTROS)
 * Implementação Sênior: Compara strings de data no fuso de Brasília para evitar bugs de timezone.
 */
export function isWithinPeriod(dateInput: any, period: string | { start: Date | string, end: Date | string }) {
  if (!dateInput) return false;
  if (period === 'all') return true;

  // Extração robusta de data (Firebase _seconds ou ISO String)
  const rawDate = dateInput?._seconds || dateInput?.seconds || dateInput;
  const seconds = typeof rawDate === 'number' ? rawDate : (rawDate?._seconds || rawDate?.seconds || null);
  const callDate = seconds ? new Date(seconds * 1000) : new Date(dateInput);

  if (isNaN(callDate.getTime())) return false;

  // Helper para formatar data em YYYY-MM-DD no fuso de Brasília
  const toBRDate = (d: Date) => 
    new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(d);

  const callDay = toBRDate(callDate);
  const today = toBRDate(new Date());

  // 1. Filtro de Data Customizada (Objeto {start, end})
  if (typeof period === 'object' && period !== null) {
    const startDay = toBRDate(new Date(period.start));
    const endDay = toBRDate(new Date(period.end));
    return callDay >= startDay && callDay <= endDay;
  }

  // 2. Filtro de Hoje
  if (period === 'today') return callDay === today;

  // 3. Filtros Relativos (7 dias / 30 dias)
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - callDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (period === '7d' || period === '7days') return diffDays <= 7;

  // 4. Filtro de Mês Atual
  if (period === 'month') {
    const toBRMonth = (d: Date) => 
      new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(d);
    return toBRMonth(callDate) === toBRMonth(now);
  }

  return true;
}

/**
 * 🛠️ FILTRO DE SEGURANÇA PARA CÁLCULO DE MÉDIA
 */
const filterValidCalls = (calls: SDRCall[]) => calls.filter(c => {
    const isDone = c.processingStatus === "DONE";
    const hasNumericScore = typeof c.nota_spin === 'number' && !isNaN(c.nota_spin);
    
    // Rota C (Descarte) nunca entra na média técnica
    if (c.status_final === "NAO_SE_APLICA") return false;

    // Se está pronto (DONE), a nota (mesmo 0) é válida para a média
    if (isDone && hasNumericScore) return true;
    
    // Fallback para notas legadas
    if (hasNumericScore && (c.nota_spin ?? 0) > 0) return true;
    
    return false;
});

/**
 * 📈 CÁLCULO DE MÉDIA SPIN
 */
export function calculateAverageSpin(calls: SDRCall[]): number {
  const analyzed = filterValidCalls(calls);
  if (analyzed.length === 0) return 0;

  const total = analyzed.reduce((acc, call) => acc + (Number(call.nota_spin) || 0), 0);
  return parseFloat((total / analyzed.length).toFixed(1));
}

/**
 * 🏆 RANKING DE SDRS
 */
export function getSDRRanking(calls: SDRCall[]) {
  if (!calls || !Array.isArray(calls)) return [];
  
  const grouped = calls.reduce((acc, call) => {
    const name = call.ownerName || "Não Identificado";
    if (!acc[name]) {
      acc[name] = { name, calls: [], totalSpin: 0, doneCount: 0 };
    }

    // VOLUME TOTAL: Registra tudo (inclusive tentativas e descartes)
    acc[name].calls.push(call);

    // ANALISADAS: Apenas o que a IA de fato avaliou com nota
    const isAnalyzed = call.processingStatus === "DONE" && typeof call.nota_spin === 'number';

    if (isAnalyzed) {
      acc[name].totalSpin += Number(call.nota_spin || 0);
      acc[name].doneCount += 1;
    }

    return acc; 
  }, {} as Record<string, { name: string; calls: SDRCall[]; totalSpin: number; doneCount: number }>);

  return Object.values(grouped)
    .map(sdr => ({
      name: sdr.name,
      avgSpin: sdr.doneCount > 0 ? parseFloat((sdr.totalSpin / sdr.doneCount).toFixed(1)) : 0,
      count: sdr.calls.length,       // Volume Bruto
      analyzedCount: sdr.doneCount   // Sucesso Técnico
    }))
    .sort((a, b) => b.avgSpin - a.avgSpin);
}