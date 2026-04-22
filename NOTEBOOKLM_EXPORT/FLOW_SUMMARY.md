# FLOW SUMMARY

## Objetivo
Este arquivo resume o fluxo provável do sistema com base nos tipos de arquivos, domínio e imports detectados.

## Fluxo provável do frontend
Fluxo sugerido:
1. páginas/layouts iniciam a navegação e a renderização
2. componentes organizam a interface
3. hooks/context centralizam estado e efeitos
4. feature-api/utils fazem integração e transformação de dados

### Fluxo de Segurança e Acesso (Impersonate)
1. **Modo Admin:** Apenas o usuário `lucas.porto@nibo.com.br` possui a flag `isAdmin = true`.
2. **Impersonate:** O Admin pode selecionar um SDR no Header. O `DashboardContext` salva o `impersonatedEmail` e todas as telas de gestão passam a exibir os dados do SDR simulado.
3. **Bloqueio SDR:** Se um usuário comum logar, o sistema bloqueia o acesso à raiz `/dashboard` e o força para a rota `/dashboard/me` (Painel de Voo individual).

### Páginas
- `frontend/src/app/page.tsx`
- `frontend/src/app/me/page.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/dashboard/upload/page.tsx`
- `frontend/src/app/dashboard/teams/page.tsx`
- `frontend/src/app/dashboard/team/page.tsx`
- `frontend/src/app/dashboard/sdrs/page.tsx`

### Layouts
- `frontend/src/app/layout.tsx`
- `frontend/src/app/dashboard/layout.tsx`

### Componentes
- `frontend/src/features/sdrs/components/sdr-insights-summary.tsx`
- `frontend/src/features/sdrs/components/sdr-stats-cards.tsx`
- `frontend/src/features/insights/components/ai-recommendations.tsx`
- `frontend/src/features/insights/components/trend-indicators.tsx`
- `frontend/src/features/gaps/components/gap-analysis-header.tsx`
- `frontend/src/features/gaps/components/sdr-impact-list.tsx`
- `frontend/src/features/evolution/components/evolution-chart.tsx`
- `frontend/src/features/evolution/components/evolution-table.tsx`

### Hooks
- `frontend/src/hooks/use-mobile.tsx`
- `frontend/src/hooks/use-toast.ts`
- `frontend/src/hooks/useCallsEngine.ts`
- `frontend/src/hooks/useSDRDashboardSync.ts`

### Contextos
- `frontend/src/context/CallContext.tsx`
- `frontend/src/context/DashboardContext.tsx`

### Feature APIs
- `frontend/src/features/dashboard/api/dashboard.service.ts`
- `frontend/src/features/calls/api/calls.service.ts`

## Fluxo provável do backend
Fluxo sugerido:
1. rotas recebem requisições
2. middlewares aplicam validação/autorização
3. services executam regra de negócio
4. clients/configs conectam integrações externas

### Rotas
- `api-server/src/routes/calls.ts`
- `api-server/src/routes/health.ts`
- `api-server/src/routes/sdr-registro.ts`
- `api-server/src/routes/stats.ts`

### Middlewares
- `api-server/src/middleware/requireAdmin.ts`

### Services
- `api-server/src/services/analysis.service.ts`
- `api-server/src/services/coaching.service.ts`
- `api-server/src/services/hubspot.ts`
- `api-server/src/services/metrics.service.ts`
- `api-server/src/services/processCall.ts`
- `api-server/src/services/recupera_ouro.ts`
- `api-server/src/services/refreshPendingAudioCall.ts`
- `api-server/src/services/webhook.service.ts`

### Clients / integrações
- `api-server/src/clients.ts`

## Fluxo provável de IA
Fluxo sugerido:
1. entrada por página/rota/upload
2. processamento em fluxo de IA
3. geração de resumo, análise ou extração de dados

### AI flows
- `frontend/src/ai/flows/extract-key-points.ts`
- `frontend/src/ai/flows/summarize-call.ts`
- `frontend/src/ai/flows/transcribe-call.ts`

## Observação
Este fluxo é heurístico. Use junto com:
- SYSTEM_OVERVIEW.md
- ARCHITECTURE.md
- INDEX.md
- MANIFEST.json
