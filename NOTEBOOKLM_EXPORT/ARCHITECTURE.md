# ARCHITECTURE

## Objetivo
Este material foi exportado para maximizar compreensão por IA e leitura humana no NotebookLM.

## Estratégia de organização
- **01-FUNDAMENTAL**: fluxo principal do sistema, bootstrap, rotas, serviços, contexto, IA, APIs centrais e configs essenciais
- **02-HIGH-VALUE**: componentes e módulos importantes para entendimento do produto
- **03-SUPPORTING**: suporte útil para contexto técnico
- **99-LOW-PRIORITY**: mocks, UI genérica e arquivos de menor valor explicativo

## Níveis de criticidade
- **critical**: arquivos centrais para entender o funcionamento
- **important**: arquivos relevantes para comportamento e uso
- **supporting**: arquivos auxiliares

## Resumo por domínio
### shared
- arquivos: 29
  - source-file: 24
  - type-definition: 2
  - package-config: 1
  - documentation: 1
  - typescript-config: 1

### frontend
- arquivos: 112
  - ui-component: 36
  - feature-component: 28
  - page: 19
  - source-file: 10
  - component: 9
  - hook: 4
  - feature-api: 2
  - context: 2
  - layout: 2

### ai
- arquivos: 5
  - ai-flow: 3
  - source-file: 2

### backend
- arquivos: 33
  - service: 9
  - source-file: 8
  - route: 4
  - bootstrap: 2
  - utility: 2
  - documentation: 1
  - package-config: 1
  - typescript-config: 1
  - client-config: 1
  - config: 1
  - type-definition: 1
  - middleware: 1
  - constant: 1

## Resumo por prioridade
- 03-SUPPORTING: 28 arquivos
- 01-FUNDAMENTAL: 77 arquivos
- 02-HIGH-VALUE: 38 arquivos
- 99-LOW-PRIORITY: 36 arquivos

## Resumo por criticidade
- supporting: 80 arquivos
- important: 78 arquivos
- critical: 21 arquivos

## Arquivos mais importantes
- `frontend/src/ai/flows/extract-key-points.ts` — ai-flow, ai, criticidade critical, score 152
- `frontend/src/ai/flows/summarize-call.ts` — ai-flow, ai, criticidade critical, score 152
- `frontend/src/ai/flows/transcribe-call.ts` — ai-flow, ai, criticidade critical, score 152
- `api-server/src/app.ts` — bootstrap, backend, criticidade critical, score 150
- `api-server/src/index.ts` — bootstrap, backend, criticidade critical, score 150
- `api-server/src/routes/calls.ts` — route, backend, criticidade critical, score 150
- `api-server/src/routes/health.ts` — route, backend, criticidade critical, score 150
- `api-server/src/routes/sdr-registro.ts` — route, backend, criticidade critical, score 150
- `api-server/src/routes/stats.ts` — route, backend, criticidade critical, score 150
- `api-server/src/services/analysis.service.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/coaching.service.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/hubspot.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/metrics.service.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/processCall.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/recupera_ouro.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/refreshPendingAudioCall.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/webhook.service.ts` — service, backend, criticidade critical, score 148
- `api-server/src/services/worker.service.ts` — service, backend, criticidade critical, score 148
- `api-server/src/config.ts` — config, backend, criticidade critical, score 145
- `api-server/src/clients.ts` — client-config, backend, criticidade critical, score 130
- `api-server/src/middleware/requireAdmin.ts` — middleware, backend, criticidade critical, score 130
- `frontend/src/features/dashboard/api/dashboard.service.ts` — feature-api, frontend, criticidade important, score 124
- `frontend/src/features/calls/api/calls.service.ts` — feature-api, frontend, criticidade important, score 124
- `api-server/INSTRUCTIONS.MD` — documentation, backend, criticidade important, score 118
- `api-server/package.json` — package-config, backend, criticidade important, score 118
- `api-server/tsconfig.json` — typescript-config, backend, criticidade important, score 118
- `api-server/src/types/analysis.ts` — type-definition, backend, criticidade important, score 118
- `api-server/src/constants/hubspot.ts` — constant, backend, criticidade important, score 118
- `api-server/src/build.ts` — source-file, backend, criticidade supporting, score 110
- `frontend/package.json` — package-config, shared, criticidade important, score 108

## Leitura sugerida para compreensão rápida
1. Comece por **critical**
2. Depois leia **01-FUNDAMENTAL/backend**
3. Em seguida **01-FUNDAMENTAL/ai**
4. Depois **01-FUNDAMENTAL/frontend**
5. Use **02-HIGH-VALUE** para aprofundamento
6. Deixe **99-LOW-PRIORITY** por último

## Regras de Negócio Core (Obrigatório para IAs)
1. **Gatekeeper (Trava de Ingestão):** O sistema só processa chamadas de uma lista estrita de `ALLOWED_OWNER_IDS` (SDRs de Elite). Chamadas fora dessa lista são ignoradas no `processCall.ts`.
2. **Dualidade de Métricas:** 
   - `real_average`: Média aritmética das notas SPIN (usada pela Gestão).
   - `ranking_score`: Média Bayesiana/Turbo (usada para gamificar e nivelar o Ranking).
3. **Catálogo Nibo:** A IA classifica chamadas em 5 produtos (Plus, WhatsApp, Conciliador, Emissor, Radar/CAC) e 4 Rotas (A, B, C, D), onde a Rota D é descarte.
4. **Coaching Evolutivo:** O sistema usa o `CoachingService` para gerar Snapshots semanais (`2026-W17`) e compara o desempenho atual com o passado para gerar narrativas de evolução.
