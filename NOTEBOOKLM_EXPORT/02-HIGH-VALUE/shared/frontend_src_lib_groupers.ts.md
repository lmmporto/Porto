# groupers.ts

## Visão geral
- Caminho original: `frontend/src/lib/groupers.ts`
- Domínio: **shared**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **70**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **20**
- Imports detectados: **1**
- Exports detectados: **2**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 02-HIGH-VALUE. Exports detectados: groupCallsBySDR, groupCallsByTeam. Funções/classes detectadas: groupCallsBySDR, groupCallsByTeam. Dependências locais detectadas: @/types. Temas relevantes detectados: calls, sdr, team.

## Dependências locais
- `@/types`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/types`

## Exports detectados
- `groupCallsBySDR`
- `groupCallsByTeam`

## Funções e classes detectadas
- `groupCallsBySDR`
- `groupCallsByTeam`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `sdr`
- `team`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
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

```
