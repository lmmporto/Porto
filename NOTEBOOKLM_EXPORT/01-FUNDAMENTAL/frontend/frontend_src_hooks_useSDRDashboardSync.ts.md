# useSDRDashboardSync.ts

## Visão geral
- Caminho original: `frontend/src/hooks/useSDRDashboardSync.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **hook**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **57**
- Imports detectados: **3**
- Exports detectados: **1**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como hook no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: useSDRDashboardSync. Funções/classes detectadas: syncData, useSDRDashboardSync. Dependências locais detectadas: @/context/CallContext, @/context/DashboardContext. Dependências externas detectadas: react. Variáveis de ambiente detectadas: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_API_URL. Temas relevantes detectados: admin, calls, dashboard, email, insights, sdr, stats, summary.

## Dependências locais
- `@/context/CallContext`
- `@/context/DashboardContext`

## Dependências externas
- `react`

## Todos os imports detectados
- `@/context/CallContext`
- `@/context/DashboardContext`
- `react`

## Exports detectados
- `useSDRDashboardSync`

## Funções e classes detectadas
- `syncData`
- `useSDRDashboardSync`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`

## Temas relevantes
- `admin`
- `calls`
- `dashboard`
- `email`
- `insights`
- `sdr`
- `stats`
- `summary`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
import { useEffect, useRef, useState } from 'react';
import { useCallContext } from '@/context/CallContext';
import { useDashboard } from '@/context/DashboardContext';

export function useSDRDashboardSync() {
  const { user, isAdmin } = useDashboard();
  const { calls, isLoading, applyFilter } = useCallContext();
  const [personalInsights, setPersonalInsights] = useState<any>(null);
  
  // 🚩 GUARDA DE MEMÓRIA: Impede disparos se o e-mail for o mesmo
  const lastFetchedEmail = useRef<string | null>(null);

  useEffect(() => {
    const email = user?.email?.toLowerCase().trim();
    
    // Só prossegue se houver e-mail e se ele for diferente do último carregado
    if (!email || lastFetchedEmail.current === email) return;

    lastFetchedEmail.current = email; // Trava o e-mail antes de disparar
    
    console.log("🚀 [SAFE LOAD] Disparando carga única para:", email);

    const rawUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const baseUrl = rawUrl.replace(/\/$/, '');
    
    // Executa a aplicação do filtro no contexto e a busca de insights pessoais
    const syncData = async () => {
      try {
        applyFilter({ ownerEmail: email });

        const res = await fetch(`${baseUrl}/api/stats/personal-summary?ownerEmail=${encodeURIComponent(email)}`, { 
          credentials: 'include' 
        });
        const data = await res.json();
        setPersonalInsights(data);
      } catch (error) {
        console.error("❌ [SYNC ERROR]:", error);
        // Em caso de erro, resetamos a trava para permitir uma nova tentativa automática ou manual
        lastFetchedEmail.current = null;
      }
    };

    syncData();
  }, [user?.email, applyFilter]); // Dependência baseada no e-mail (primitivo)

  return { 
    user, 
    calls, 
    isLoading, 
    personalInsights, 
    isAdmin, 
    refresh: () => {
      lastFetchedEmail.current = null;
      // O useEffect reagirá ao reset da ref no próximo ciclo se o e-mail existir
    }
  };
}
```
