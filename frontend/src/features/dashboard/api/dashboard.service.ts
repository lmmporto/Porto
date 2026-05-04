import { formatDuration } from "@/lib/utils";

/**
 * Busca os KPIs agregados via REST API.
 * Esse endpoint já faz o cálculo pesado no backend.
 */
export const getKPIs = async (period: string, team: string, route: string = 'all') => {
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const response = await fetch(`${API_URL}/api/stats?period=${period}&team=${encodeURIComponent(team)}&route=${route}`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Falha ao buscar KPIs');
  return response.json();
};

/**
 * Busca o ranking de SDRs via REST API.
 * Substitui o antigo subscribeToRanking que usava onSnapshot e causava alto consumo de leituras.
 */
export const getRanking = async (
  period: string,
  team: string,
  route: string = 'all'
): Promise<any[]> => {
  const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ''
  ).replace(/\/$/, '');

  const response = await fetch(
    `${API_URL}/api/ranking?period=${period}&team=${encodeURIComponent(team)}&route=${route}`,
    { credentials: 'include' }
  );
  if (!response.ok) throw new Error('Falha ao buscar ranking');
  return response.json();
};
