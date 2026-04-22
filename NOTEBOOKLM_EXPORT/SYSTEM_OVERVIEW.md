# SYSTEM OVERVIEW

## Objetivo
Este material foi gerado para ajudar o NotebookLM e a leitura humana a entenderem o sistema de forma mais confiável.

## Visão geral do sistema
- Total de arquivos exportados: **179**
- Arquivos ignorados por tamanho: **0**
- Arquivos ignorados por leitura inválida: **0**

## Distribuição por domínio
- ai: 5 arquivos
- backend: 33 arquivos
- frontend: 112 arquivos
- shared: 29 arquivos

## Arquivos de entrada do sistema
- `api-server/src/app.ts`
- `api-server/src/index.ts`
- `api-server/src/routes/calls.ts`
- `api-server/src/routes/health.ts`
- `api-server/src/routes/sdr-registro.ts`
- `api-server/src/routes/stats.ts`
- `api-server/package.json`
- `frontend/package.json`
- `frontend/src/app/page.tsx`
- `frontend/src/app/me/page.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/dashboard/upload/page.tsx`
- `frontend/src/app/dashboard/teams/page.tsx`
- `frontend/src/app/dashboard/team/page.tsx`

## Arquivos críticos
- `frontend/src/ai/flows/extract-key-points.ts` — ai-flow
- `frontend/src/ai/flows/summarize-call.ts` — ai-flow
- `frontend/src/ai/flows/transcribe-call.ts` — ai-flow
- `api-server/src/app.ts` — bootstrap
- `api-server/src/index.ts` — bootstrap
- `api-server/src/routes/calls.ts` — route
- `api-server/src/routes/health.ts` — route
- `api-server/src/routes/sdr-registro.ts` — route
- `api-server/src/routes/stats.ts` — route
- `api-server/src/services/analysis.service.ts` — service
- `api-server/src/services/coaching.service.ts` — service
- `api-server/src/services/hubspot.ts` — service
- `api-server/src/services/metrics.service.ts` — service
- `api-server/src/services/processCall.ts` — service
- `api-server/src/services/recupera_ouro.ts` — service
- `api-server/src/services/refreshPendingAudioCall.ts` — service
- `api-server/src/services/webhook.service.ts` — service
- `api-server/src/services/worker.service.ts` — service
- `api-server/src/config.ts` — config
- `api-server/src/clients.ts` — client-config

## Arquivos importantes
- `frontend/src/features/dashboard/api/dashboard.service.ts` — feature-api
- `frontend/src/features/calls/api/calls.service.ts` — feature-api
- `api-server/INSTRUCTIONS.MD` — documentation
- `api-server/package.json` — package-config
- `api-server/tsconfig.json` — typescript-config
- `api-server/src/types/analysis.ts` — type-definition
- `api-server/src/constants/hubspot.ts` — constant
- `frontend/package.json` — package-config
- `frontend/README.md` — documentation
- `frontend/tsconfig.json` — typescript-config
- `frontend/src/types/call.ts` — type-definition
- `frontend/src/types/index.ts` — type-definition
- `frontend/src/hooks/use-mobile.tsx` — hook
- `frontend/src/hooks/use-toast.ts` — hook
- `frontend/src/hooks/useCallsEngine.ts` — hook
- `frontend/src/hooks/useSDRDashboardSync.ts` — hook
- `frontend/src/features/sdrs/components/sdr-insights-summary.tsx` — feature-component
- `frontend/src/features/sdrs/components/sdr-stats-cards.tsx` — feature-component
- `frontend/src/features/insights/components/ai-recommendations.tsx` — feature-component
- `frontend/src/features/insights/components/trend-indicators.tsx` — feature-component

## Núcleo provável do fluxo
- `frontend/src/ai/flows/extract-key-points.ts` — ai-flow
- `frontend/src/ai/flows/summarize-call.ts` — ai-flow
- `frontend/src/ai/flows/transcribe-call.ts` — ai-flow
- `api-server/src/app.ts` — bootstrap
- `api-server/src/index.ts` — bootstrap
- `api-server/src/routes/calls.ts` — route
- `api-server/src/routes/health.ts` — route
- `api-server/src/routes/sdr-registro.ts` — route
- `api-server/src/routes/stats.ts` — route
- `api-server/src/services/analysis.service.ts` — service
- `api-server/src/services/coaching.service.ts` — service
- `api-server/src/services/hubspot.ts` — service
- `api-server/src/services/metrics.service.ts` — service
- `api-server/src/services/processCall.ts` — service
- `api-server/src/services/recupera_ouro.ts` — service
- `api-server/src/services/refreshPendingAudioCall.ts` — service
- `api-server/src/services/webhook.service.ts` — service
- `api-server/src/services/worker.service.ts` — service
- `api-server/src/config.ts` — config
- `api-server/src/clients.ts` — client-config

## Integrações externas detectadas
- `../constants/hubspot.js`
- `../firebase.js`
- `../utils/hubspot-parser.js`
- `./hubspot.js`
- `./src/firebase.js`
- `./src/firebase.ts`
- `@/ai/genkit`
- `@/lib/firebase`
- `@genkit-ai/google-genai`
- `axios`
- `firebase-admin`
- `firebase-admin/firestore`
- `firebase/firestore`
- `genkit`

## Temas recorrentes detectados
- **Design System:** Obsidian Lens (Dark Mode, Glassmorphism, Tonal Layering).
- **Leitura Eficiente:** O Frontend NUNCA lê a coleção `calls_analysis` para gerar KPIs. Ele lê apenas o documento `dashboard_stats/global_summary` e a coleção `sdrs` para economizar leituras no Firestore.
- admin
- analysis
- auth
- calls
- coaching
- crm
- dashboard
- email
- evolution
- firebase
- health
- hubspot
- insights
- job
- metrics
- notification
- parser
- queue
- ranking
- sdr
- session
- stats
- summarize
- summary
- team
- token
- transcribe
- upload
- webhook
- worker

## Ordem recomendada de leitura
1. SYSTEM_OVERVIEW.md
2. FLOW_SUMMARY.md
3. ARCHITECTURE.md
4. INDEX.md
5. Arquivos críticos
6. Arquivos importantes
7. Arquivos de suporte

## Observação
Use este arquivo como ponto de partida para orientar o NotebookLM antes de aprofundar a leitura dos arquivos individuais.
