# Porto: SDR Call Analyzer - Project Knowledge

## 🎯 Propósito do Aplicativo
O **Porto** é um ecossistema de monitoramento e análise de performance para **SDRs (Sales Development Representatives)**. O objetivo principal é automatizar a avaliação de chamadas de vendas, utilizando IA para identificar padrões de comportamento, aderência a metodologias de vendas e fornecer insights acionáveis para coaching.

- **Foco**: Análise profunda baseada na metodologia **SPIN Selling**.
- **Valor**: Identificar falhas de abordagem, oportunidades perdidas e gamificar a performance dos SDRs.

## 🛠️ Stack Tecnológica

### Backend (`api-server`)
- **Runtime**: Node.js com TypeScript (v6).
- **Framework**: Express (v5).
- **Banco de Dados**: Firebase Firestore (dados operacionais) e Supabase (vector store para RAG de artigos de ajuda).
- **IA**: Google Generative AI (Gemini) para transcrição e análise de áudio em um único pipeline.
- **Integrações**: HubSpot API (Webhooks e busca de gravações).
- **Agendamento**: `node-cron` para tarefas periódicas.

### Frontend (`frontend`)
- **Framework**: Next.js (v15.5) com App Router.
- **UI**: React 19, Tailwind CSS, Shadcn/UI (Radix UI).
- **Gráficos**: Recharts para visualização de KPIs.
- **IA Local**: Genkit AI integrado para funcionalidades de assistência.
- **Design System**: **Obsidian Lens** (Dark Mode, Glassmorphism, Tonal Layering).

## 📂 Estrutura de Pastas

### Backend (`/api-server/src`)
- `routes/`: Definição de endpoints HTTP.
- `services/`: Lógica de negócio central (ex: `processCall.ts`, `analysis.service.ts`).
- `domain/`: Entidades e regras de domínio puras.
- `infrastructure/`: Implementações de drivers e integrações externas.
- `scripts/`: Ferramentas de manutenção, migração e testes.
- `types/`: Definições de tipos TypeScript compartilhados.

### Frontend (`/frontend/src`)
- `app/`: Rotas, páginas e API routes (Proxies).
- `features/`: Componentes e lógica organizados por domínio (ex: `dashboard`, `sdr`).
- `components/`: Componentes de UI reutilizáveis (Shadcn).
- `lib/`: Utilitários, instâncias de SDKs e helpers.
- `hooks/`: React hooks customizados para consumo de dados.

## 📐 Padrões de Código e Regras de Ouro

1.  **Filtro de Descarte (Tempo Mínimo)**: Chamadas com menos de **60 segundos** são descartadas da análise profunda (`SKIPPED_SHORT_CALL`) para não poluir as médias.
2.  **Filtro de Equipes**: Apenas SDRs e Pré-Venda são processados. Times como "CX" ou "Suporte" são ignorados, a menos que o nome contenha "SDR".
3.  **Proxy de Segurança**: O frontend **nunca** acessa o backend do Render diretamente. Ele utiliza as `API Routes` do Next.js como proxy para proteção de chaves e controle de CORS.
4.  **Consumo de Dados**: O Dashboard consome agregados pré-calculados na coleção `dashboard_stats` em vez de consultar calls individuais, garantindo performance e baixo custo de leitura no Firestore.
5.  **Tratamento de Erros**: Falhas na IA devem resultar em status `FAILED_ANALYSIS` com log detalhado, nunca silenciando o erro.

## 💡 Decisões Importantes e Atualizações
- **Metodologia SPIN**: A análise de IA é estritamente orientada a identificar perguntas de Situação, Problema, Implicação e Necessidade de Solução. O prompt do "Mestre Mentor" exige rastreamento dos 5 estados (Rapport, Dor, Objeções, Controle, Próximo Passo) em cada turno.
- **Métrica Dual**: 
    - `real_average`: Média aritmética simples para relatórios gerenciais.
    - `ranking_score`: Média Bayesiana ("Turbo") para o Ranking, evitando que SDRs com poucas calls (ex: 1 call nota 10) dominem o topo injustamente.
- **Pipeline Unificado**: Optou-se por usar o Gemini para transcrição e análise simultânea, reduzindo latência e custo.
- **Fallback de Áudio Fresco**: O orquestrador agora prioriza dados recém-buscados do HubSpot (recordingUrl) em detrimento do cache do Firestore, resolvendo o problema de ligações travadas sem áudio.
- **Recuperação de Chamadas "Órfãs"**: O Repositório agora utiliza `includeNullRetry` para fazer merges de queries paralelas, recuperando documentos presos em `PENDING_AUDIO` sem campo `nextRetryAt`.
- **Limite de Descarte por Antiguidade**: Aumentado de 24 horas para 30 dias na fila `PENDING_AUDIO` (OLD_CALL_PURGE), permitindo tempo adequado para recuperação de áudios atrasados.
- **Defensiva no Frontend**: Componentes que exibem dados da IA (como o `CallInsights.tsx` e `SdrProfilePanel.tsx`) possuem "guards" defensivos (ex: validar se `insights_estrategicos` é um array de objetos ou se `score_proximo_passo` existe) para evitar quebra ao processar dados históricos.
- **Métrica "Próximo Passo"**: Implementada a visualização do `score_proximo_passo` no Flight Deck do SDR (KPI card e barra de progresso) e no Health Radar. O cálculo da média consolidada (`media_proximo_passo`) ignora registros ausentes ou zerados para não distorcer a performance histórica.
- **Validação e Normalização com Zod**: Migrada a validação de respostas da IA para Zod (`analysis.schemas.ts`). O sistema utiliza `ANALYSIS_RESPONSE_SCHEMA.parse()` dentro de `normalizeAnalysisResult` para garantir que campos opcionais recebam valores padrão (defaults) antes de qualquer operação de mapeamento ou sanitização, eliminando erros de `undefined.map()`.
- **Justiça Contextual (Prompt V10)**: O motor de IA ("Mestre Mentor") foi atualizado com regras estritas de "Justiça Contextual". Ele é instruído a não penalizar o SDR por problemas técnicos (áudio ruim, queda de ligação) ou por leads que não são o interlocutor correto. O foco da nota mudou para a **Capacidade de Adaptação** e **Gestão Estratégica** dos estados da conversa.
- **Persistência com Fallback Logístico**: O orquestrador (`call-processing.orchestrator.ts`) implementa um fallback matemático para o `score_proximo_passo` (`10 - dominio - dor`) caso a IA não o retorne em modelos antigos. Além disso, utiliza `JSON.parse(JSON.stringify())` para sanitizar o payload antes do Firestore, removendo campos `undefined` que causariam falha na escrita.
- **Defensiva no Frontend**: Componentes como `CallInsights.tsx` e `SdrProfilePanel.tsx` utilizam guards ternários e validações de array (`Array.isArray`) para lidar com a transição do campo `insights_estrategicos` de string (legado) para array de objetos (novo).
- **Hospedagem**: Backend no Render (CI exige sincronia estrita do `pnpm-lock.yaml`) e Frontend na Vercel.
- **Correção de Loop de Redirect (30/04/2026)**: Removido guard legado no `SdrProfilePanel.tsx` que redirecionava o email do admin para `/dashboard`. Esse guard criava um loop infinito com a regra do `DashboardContext` que manda usuários comuns de `/dashboard` para `/dashboard/me`. Regra: nunca adicionar redirects hardcoded por email em componentes — toda lógica de redirect deve viver exclusivamente no `DashboardContext`.
- **Problema de isAdmin (30/04/2026)**: O flag `isAdmin` é derivado do campo `admins` no documento `configuracoes/gerais` do Firestore. Se um email de admin não estiver nesse documento, o sistema trata o usuário como SDR comum e oculta o dashboard gerencial. Para corrigir, rodar o script `api-server/scripts/check-and-fix-admins.ts`. Nunca hardcodar emails de admin no código frontend.

---
*Documentação gerada automaticamente pela Antigravity para referência contínua.*

## Documentos de padrões estabelecidos

- `firestore-listeners-pattern.md` — regras de cleanup de listeners
- `analysis-schema-v10.md` — schema V10, scores e enums do motor de IA
- `firestore-migration-pattern.md` — padrão de scripts de migração
- `context-export-pattern.md` — padrão de exportação no DashboardContext
