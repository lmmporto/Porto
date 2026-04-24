# architecture.md

## Visão geral inferida

Este export contém arquivos de backend, frontend, configuração e suporte do projeto.

## Distribuição
- Backend: 73
- Frontend: 140
- Configuração: 0
- Críticos: 14

## Backend
Arquivos classificados como backend geralmente concentram:
- rotas HTTP
- serviços de domínio
- integrações externas
- workers
- persistência
- processamento de chamadas

## Frontend
Arquivos classificados como frontend geralmente concentram:
- páginas Next.js
- componentes de dashboard
- telas de histórico
- telas de SDR
- estados de UI

## Arquivos críticos detectados
- `api-server/src/domain/analysis/analysis.constants.ts`
- `api-server/src/domain/analysis/analysis.policy.ts`
- `api-server/src/domain/analysis/analysis.prompts.ts`
- `api-server/src/domain/analysis/analysis.schemas.ts`
- `api-server/src/domain/analysis/analysis.types.ts`
- `api-server/src/domain/analysis/ranking.logic.ts`
- `api-server/src/infrastructure/database/analysis.repository.ts`
- `api-server/src/services/analysis.orchestrator.ts`
- `api-server/src/services/analysis.service.ts`
- `api-server/src/services/processCall.ts`
- `api-server/src/types/analysis.ts`
- `frontend/src/features/calls/components/analysis-insights.tsx`
- `frontend/src/features/calls/components/CallAnalysis.tsx`
- `frontend/src/features/dashboard/components/global-gap-analysis.tsx`

## Recomendações para usar no NotebookLM
1. Suba primeiro este arquivo.
2. Depois suba `INDEX.md`.
3. Depois suba os arquivos em `00_CRITICAL`.
4. Depois suba os arquivos em `01_HIGH`.
5. Use os demais apenas quando a tarefa exigir.
