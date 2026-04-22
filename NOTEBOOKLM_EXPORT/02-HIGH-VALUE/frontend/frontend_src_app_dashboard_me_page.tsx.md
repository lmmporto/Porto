# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/me/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **29**
- Imports detectados: **3**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: MyDashboardPage, function. Funções/classes detectadas: MyDashboardPage. Dependências locais detectadas: @/context/DashboardContext, @/features/dashboard/components/SdrProfilePanel, @/lib/utils. Temas relevantes detectados: dashboard, email, sdr. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component.

## Dependências locais
- `@/context/DashboardContext`
- `@/features/dashboard/components/SdrProfilePanel`
- `@/lib/utils`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/context/DashboardContext`
- `@/features/dashboard/components/SdrProfilePanel`
- `@/lib/utils`

## Exports detectados
- `MyDashboardPage`
- `function`

## Funções e classes detectadas
- `MyDashboardPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `dashboard`
- `email`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`

## Código
```tsx
'use client';

import { useDashboard } from '@/context/DashboardContext';
import { SdrProfilePanel } from '@/features/dashboard/components/SdrProfilePanel';
import { formatEmailToSdrId } from '@/lib/utils';

export default function MyDashboardPage() {
  const { user, viewingEmail } = useDashboard();

  // Filtro de Consciência: Prioriza a simulação se houver
  const activeEmail = viewingEmail || user?.email;

  if (!activeEmail) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#020817] text-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple border-t-transparent mx-auto mb-4"></div>
          <p className="text-soft">Autenticando acesso ao Flight Deck...</p>
        </div>
      </div>
    );
  }

  // O sdrId para busca no Firestore é o email puro (normalização ocorre no painel)
  const sdrId = activeEmail;

  return <SdrProfilePanel sdrId={sdrId} />;
}

```
