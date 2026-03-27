import { SDRCall, StatusFinal } from '@/types';

/**
 * 📅 VALIDAÇÃO DE PERÍODO (FILTROS)
 * Aprimorado para ser robusto com Timestamps do Firebase e Datas Customizadas.
 */
export function isWithinPeriod(dateInput: any, period: string | { start: Date | string, end: Date | string }) {
  if (!dateInput) return false;
  if (period === 'all') return true;

  const rawDate = dateInput?._seconds || dateInput?.seconds || dateInput;
  const seconds = typeof rawDate === 'number' ? rawDate : (rawDate?._seconds || rawDate?.seconds || null);
  
  let callDate: Date;
  if (seconds) {
    callDate = new Date(seconds * 1000);
  } else {
    callDate = new Date(dateInput);
  }

  if (isNaN(callDate.getTime())) return false;

  // Filtro de Data Customizada (Objeto {start, end})
  if (typeof period === 'object' && period !== null) {
    const startDate = new Date(period.start);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(period.end);
    endDate.setHours(23, 59, 59, 999);
    
    return callDate.getTime() >= startDate.getTime() && callDate.getTime() <= endDate.getTime();
  }

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - callDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (period === 'today') {
    return callDate.getDate() === now.getDate() && 
           callDate.getMonth() === now.getMonth() && 
           callDate.getFullYear() === now.getFullYear();
  }
  if (period === '7d' || period === '7days') return diffDays <= 7;
  if (period === '30days') return diffDays <= 30;
  if (period === 'month') {
    return callDate.getMonth() === now.getMonth() && callDate.getFullYear() === now.getFullYear();
  }

  return true;
}

/**
 * 🛠️ FILTRO DE SEGURANÇA PARA CÁLCULO DE MÉDIA
 * Uma chamada entra para a média se:
 * 1. O status for "DONE".
 * 2. Tiver nota numérica.
 * 3. NÃO for "NAO_SE_APLICA" (Rota C - Conversas genéricas não contam para média técnica).
 * 4. NÃO for "SKIPPED_FOR_AUDIT" ou "SKIPPED_SHORT_CALL".
 */
const filterValidCalls = (calls: SDRCall[]) => calls.filter(c => {
    const hasNumericScore = typeof c.nota_spin === 'number' && !isNaN(c.nota_spin);
    const isSkipped = c.processingStatus === "SKIPPED_FOR_AUDIT" || c.processingStatus === "SKIPPED_SHORT_CALL";
    const isRotaC = c.status_final === "NAO_SE_APLICA";
    
    // Se for pulada ou Rota C, não entra no cálculo da média de performance
    if (isSkipped || isRotaC) return false;

    // Condição padrão: Processamento concluído com nota
    if (c.processingStatus === "DONE" && hasNumericScore) {
        return true;
    }
    
    // Fallback para casos legados com nota mas sem status explicitado
    if (hasNumericScore && c.nota_spin > 0) {
        return true;
    }
    
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
 * 📊 CONTAGEM DE STATUS
 */
export function getStatusCounts(calls: SDRCall[]) {
  const analyzed = calls.filter(c => c.processingStatus === "DONE");
  
  return analyzed.reduce(
    (acc, call) => {
      const status = call.status_final || "NAO_IDENTIFICADO";
      if (acc[status as StatusFinal] !== undefined) {
        acc[status as StatusFinal] = (acc[status as StatusFinal] || 0) + 1;
      }
      return acc;
    },
    { APROVADO: 0, ATENCAO: 0, REPROVADO: 0, NAO_IDENTIFICADO: 0, NAO_SE_APLICA: 0 } as Record<StatusFinal, number>
  );
}

/**
 * 🏆 RANKING DE SDRS (Fallback para listas filtradas)
 * Divide o volume em 'count' (tentativas totais) e 'analyzedCount' (sucesso técnico).
 */
export function getSDRRanking(calls: SDRCall[]) {
  if (!calls || !Array.isArray(calls)) return [];
  
  const grouped = calls.reduce((acc, call) => {
    const name = call.ownerName || "Não Identificado";
    
    if (!acc[name]) {
      acc[name] = { name, calls: [], totalSpin: 0, doneCount: 0 };
    }

    acc[name].calls.push(call);

    const isValidForMedia = filterValidCalls([call]).length > 0;

    if (isValidForMedia) {
      acc[name].totalSpin += Number(call.nota_spin || 0);
      acc[name].doneCount += 1;
    }

    return acc; 
  }, {} as Record<string, { name: string; calls: SDRCall[]; totalSpin: number; doneCount: number }>);

  return Object.values(grouped)
    .map(sdr => ({
      name: sdr.name,
      avgSpin: sdr.doneCount > 0 ? parseFloat((sdr.totalSpin / sdr.doneCount).toFixed(1)) : 0,
      count: sdr.calls.length,
      analyzedCount: sdr.doneCount
    }))
    .sort((a, b) => b.avgSpin - a.avgSpin);
}