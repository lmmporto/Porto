# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/sdrs/[id]/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **21**
- Imports detectados: **2**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: SdrDetailPage, function. Funções/classes detectadas: SdrDetailPage. Dependências locais detectadas: @/features/dashboard/components/SdrProfilePanel. Dependências externas detectadas: react. Temas relevantes detectados: dashboard, sdr. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component.

## Dependências locais
- `@/features/dashboard/components/SdrProfilePanel`

## Dependências externas
- `react`

## Todos os imports detectados
- `@/features/dashboard/components/SdrProfilePanel`
- `react`

## Exports detectados
- `SdrDetailPage`
- `function`

## Funções e classes detectadas
- `SdrDetailPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `dashboard`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`

## Código
```tsx
'use client';

import { use } from 'react';
import { SdrProfilePanel } from '@/features/dashboard/components/SdrProfilePanel';

interface SdrPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SdrDetailPage({ params }: SdrPageProps) {
  const resolvedParams = use(params);
  const sdrId = resolvedParams.id;

  if (!sdrId) {
    return <div>ID do SDR não fornecido.</div>;
  }

  return <SdrProfilePanel sdrId={sdrId} />;
}
```
