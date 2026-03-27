import type { SDRCall } from '@/types';

export function groupCallsByTeam(calls: SDRCall[]): Record<string, SDRCall[]> {
  return calls.reduce((acc, call) => {
    const team = call.teamName || 'Sem Equipe';
    if (!acc[team]) acc[team] = [];
    acc[team].push(call);
    return acc;
  }, {} as Record<string, SDRCall[]>);
}

export function groupCallsBySDR(calls: SDRCall[]): Record<string, SDRCall[]> {
  return calls.reduce((acc, call) => {
    const sdr = call.ownerName;
    if (!acc[sdr]) acc[sdr] = [];
    acc[sdr].push(call);
    return acc;
  }, {} as Record<string, SDRCall[]>);
}
