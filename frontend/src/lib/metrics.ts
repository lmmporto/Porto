import { SDRCall, StatusFinal } from '@/types';

/**
 * 📅 VALIDAÇÃO DE PERÍODO (FILTROS)
 * Se você não entende como o Firebase guarda data, nem deveria estar mexendo nisso.
 */
export function isWithinPeriod(dateInput: any, period: string | { start: Date | string, end: Date | string }) {
  if (!dateInput) return false;
  if (period === 'all') return true;

  // 🚩 Garante que a data do Firebase (_seconds) seja convertida sem frescura
  const rawDate = dateInput?._seconds || dateInput?.seconds || dateInput;
  const seconds = typeof rawDate === 'number' ? rawDate : (rawDate?._seconds || rawDate?.seconds || null);
  
  let callDate: Date;
  if (seconds) {
    callDate = new Date(seconds * 1000);
  } else {
    callDate = new Date(dateInput);
  }

  if (isNaN(callDate.getTime())) return false;

  const now = new Date();

  // Filtro de Data Customizada
  if (typeof period === 'object' && period !== null) {
    const startDate = new Date(period.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(period.end);
    endDate.setHours(23, 59, 59, 999);
    return callDate.getTime() >= startDate.getTime() && callDate.getTime() <= endDate.getTime();
  }

  // 🚩 Lógica de hoje corrigida para não ser uma zona de fuso horário
  if (period === 'today') {
    return callDate.toDateString() === now.toDateString();
  }

  const diffTime = Math.abs(now.getTime() - callDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (period === '7d' || period === '7days') return diffDays <= 7;
  if (period === 'month') {
    return callDate.getMonth() === now.getMonth() && callDate.getFullYear() === now.getFullYear();
  }

  return true;
}

/**
 * 🛠️ FILTRO DE SEGURANÇA PARA CÁLCULO DE MÉDIA
 */
const filterValidCalls = (calls: SDRCall[]) => calls.filter(c => {
    // 🚩 AQUI ESTAVA A TUA BURRICE: 
    // Aceitamos nota 0 se o status for DONE. Se for SKIPPED, some daqui.
    const isDone = c.processingStatus === "DONE";
    const hasNumericScore = typeof c.nota_spin === 'number' && !isNaN(c.nota_spin);
    
    // Se foi descartada (Rota C), não entra na média técnica de jeito nenhum.
    if (c.status_final === "NAO_SE_APLICA") return false;

    // Se tá pronto, a nota (mesmo que 0) é o que vale.
    if (isDone && hasNumericScore) return true;
    
    // Fallback pra casos onde a nota existe mas o status bugou
    if (hasNumericScore && c.nota_spin > 0) return true;
    
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

    // 🚩 VOLUME TOTAL: Conta TUDO, inclusive as porcarias de tentativas (SKIPPED)
    acc[name].calls.push(call);

    // 🚩 ANALISADAS: Segue a mesma lógica do filtro de média
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
      count: sdr.calls.length,       // 🚩 Volume Total de chamadas
      analyzedCount: sdr.doneCount   // 🚩 Apenas as que a IA terminou
    }))
    .sort((a, b) => b.avgSpin - a.avgSpin);
}