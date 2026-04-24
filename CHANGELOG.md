# Changelog

## [1.8.3] - 2026-04-23
- **Correção de Fluxo:** Padronizado o status de entrada manual para `QUEUED` para garantir compatibilidade com o Worker.
- **Sincronização:** Ajustada a lógica de trigger para evitar que chamadas fiquem presas em `PROCESSING` sem um executor ativo.


## [1.8.2] - 2026-04-23
- **Frontend:** Implementado gatilho manual de análise de chamadas com requisição de API via Axios e feedback visual via Toasts.
- **Backend Worker:** Adicionado tratamento de erros robusto no worker para capturar e logar falhas de query no Firestore, facilitando a depuração de índices compostos ausentes.
- **Resiliência:** Reforçada a detecção de chamadas pendentes via máquina de estados no trabalhador de segundo plano.


## [1.8.1] - 2026-04-23
- **Arquitetura de Resiliência:** Implementada fila de retentativas automáticas (Retry Queue) para chamadas do HubSpot sem áudio imediato.
- **Fluxo:** Chamadas sem `recordingUrl` agora recebem o status `PENDING_AUDIO` em vez de falharem imediatamente.
- **Worker:** O sistema tenta buscar o áudio novamente a cada 10 minutos, com um limite máximo de 5 tentativas (~50 minutos), antes de marcar a chamada definitivamente como `FAILED_NO_AUDIO`.


## [1.3.0] - 2026-04-23
- **Refatoração Estrutural: Soberania do SDR Registry Implementada**
- O campo `teamName` foi removido da coleção `calls_analysis`. O `sdr_registry` é agora a única fonte da verdade para times.
- `processCall.ts` não grava mais informações de time, apenas valida a atividade do SDR.
- `dashboard.service.ts` foi completamente refatorado para usar lookups dinâmicos de e-mail em todas as consultas em tempo real, garantindo que a UI sempre reflita a estrutura de times atual.

## [1.2.7] - 2026-04-23
- **Refatoração Majoritária**: `dashboard.service.ts` agora utiliza a "Soberania do SDR Registry" para listeners em tempo real.
- As funções `subscribeToGlobalStats` e `subscribeToRanking` agora consultam dinamicamente os membros do time.
- Implementado suporte a *chunking* para times com mais de 30 SDRs, contornando a limitação do Firestore.
- Adicionada sanitização de e-mails para garantir consistência nas queries.

## [1.2.6] - 2026-04-22
- Corrigido roteamento da página de configurações (`/dashboard/settings`).
- Validada estrutura de `layout.tsx` para suporte a sub-rotas no Dashboard.

## [1.2.5] - 2026-04-22
- Adicionado script de migração `migrate-sdr.js` para padronização de documentos no Firestore.
- Garantida a integridade dos campos `isActive` e `assignedTeam` para todos os SDRs existentes.
Instrução de uso:
Para executar, certifique-se de que o ambiente está configurado e rode no terminal:
`node api-server/scripts/migrate-sdr.js`

## [1.2.4] - 2026-04-22
- Criada página `/dashboard/settings` para gestão de times.
- Refatorado `DashboardContext` para carregamento dinâmico de membros via API.
- Integrada UI de gestão com o endpoint `PUT /update-sdr`.

## [1.2.3] - 2026-04-22
- Refatoração completa para sintaxe nativa do Firestore (SDK).
- Implementado Gatekeeper em `processCall.ts` via `doc().get()`.
- Refatorado `MetricsService` com suporte a `where('in', ...)` segmentado.
- Protegida rota `/update-sdr` com `requireAdmin` e tratamento de erros.

## [1.7.2] - 2026-04-16
- Otimização: Implantada arquitetura "Agregados no Dashboard, Detalhes no Clique".
- Performance: Proibida leitura da coleção `calls_analysis` para KPIs no frontend.
- Refatorado: `subscribeToGlobalStats` para ler exclusivamente `dashboard_stats`.
- Adicionado: Fallback automático para o último documento diário disponível.
- Otimização: Aplicado limite estrito (`limit(15)`) na listagem de chamadas.

## [1.7.1] - 2026-04-16
- Adicionado: Listagem de chamadas real conectada à coleção `calls_analysis`.
- Reconstruído: Detalhe da Call (`/dashboard/calls/[id]`) com suporte a resumo, playbook e insights.
- Implementado: Busca resiliente de SDR (ID vs Email) para evitar erros de navegação.
- Sincronizado: Componentes de detalhe com campos `nota_spin`, `ownerName` e `produto_principal`.

## [1.7.0] - 2026-04-16
- Adicionado: Script de seed atualizado com `callTimestamp` e `global_summary`.
- Implementado: Busca resiliente de SDR (ID vs Email) no perfil.
- Corrigido: Roteamento no Ranking utilizando IDs reais do Firestore.
- Ativado: Tela de Insights com dados reais da coleção `calls_analysis`.

## [1.6.9] - 2026-04-16
- Corrigido: Erro `Expected first argument to collection() to be a Database` via blindagem na inicialização.
- Adicionado: Logs de depuração no navegador para validar variáveis `NEXT_PUBLIC`.
- Implementado: Cláusulas de guarda nos serviços de dados para evitar crashes.
- Reforçado: Padrão Singleton para a instância do Firebase App.

## [1.6.8] - 2026-04-16
- Adicionado: Inicialização do Firebase Client em `src/lib/firebase.ts`.
- Corrigido: Erro de build `Module not found` via sincronização do componente `CallRow`.
- Ajustado: Import no detalhe do SDR para refletir o caminho correto.
- Adicionado: Log de depuração para conexão com Firestore.

## [1.6.7] - 2026-04-16
- Adicionado: Persistência no documento `global_summary` para histórico total.
- Corrigido: Tipagem de transação no backend com `admin.firestore.Transaction` e cast `as any`.
- Padronizado: Nomes de campos entre Backend e Frontend para `snake_case` (`total_calls`, `media_geral`, `taxa_aprovacao`).
- Sincronizado: Lógica de incremento de estatísticas para integridade global.

## [1.6.6] - 2026-04-16
- Otimização: Implementado padrão "Leitura Leve" (KPIs via `dashboard_stats`).
- Correção: Apontamento oficial para `calls_analysis` e `sdrs`.
- Debug: Adicionado log `RAW DATA SAMPLE` para inspeção de campos.
- UX: Definido período 'Hoje' como filtro padrão do Dashboard.

## [1.6.5] - 2026-04-16
- Adicionado: Seletor de período ('Hoje', '7D', '30D', 'Tudo') no Dashboard.
- Implementado: Lógica de agregação em tempo real no `dashboard.service.ts`.
- Fallback: Cálculo automático de KPIs a partir da coleção `calls_analysis` se o documento diário não existir.
- Ajustado: Suporte a IDs de SDR com caracteres especiais.

## [1.6.4] - 2026-04-16
- Ajustado: Subscrição de estatísticas para ler `dashboard_stats/{hoje}`.
- Sincronizado: Listagem de chamadas com `calls_analysis`.
- Implementado: Conversão de `callTimestamp` para `Date`.
- Ajustado: Perfil do SDR filtrando por `ownerEmail`.
- Refatorado: `CallInsights` para mapear `insights_estrategicos` dinamicamente.

## [1.6.3] - 2026-04-16
- Corrigido: Erro de rede `Unexpected token '<'` (removido `fetch` obsoleto).
- Implementado: Conexão direta via Firestore `onSnapshot` no detalhe do SDR.
- Corrigido: Exibição de dados nas páginas de Ranking e Equipe.
- Sincronizado: Campos `real_average` e `ranking_score` na interface.

## [1.6.2] - 2026-04-16
- Corrigido: Configuração do Firebase Client (`src/lib/firebase.ts`).
- Sincronizado: `dashboard.service.ts` com schema v1.4.0 (`nota_spin` e `sdr_stats`).
- Garantido: Resolução de caminhos via alias `@/` no `tsconfig.json`.
- Ativado: Conexão em tempo real entre Frontend e Firestore.

## [1.6.1] - 2026-04-16
- Corrigido: Erro de build `Module not found` para `TeamStats`.
- Criado: Componente `TeamStats.tsx` com suporte a KPIs dinâmicos e design Obsidian Lens.
- Ajustado: Capitalização de imports no `dashboard/page.tsx`.
- Implementado: Proteção contra valores nulos na renderização de métricas.

## [1.6.0] - 2026-04-16
- Adicionado: Rotas `/dashboard/ranking` e `/dashboard/team`.
- Conectado: Hooks de tempo real (`onSnapshot`) no Dashboard.
- Implementado: Navegabilidade entre Ranking, Perfil e Detalhe de Call.
- Substituído: Mocks por dados reais do Firestore.
- Refatorado: Componente de Insights para renderização dinâmica.

## [1.5.1] - 2026-04-16
- Corrigido: Erro de build `Psychology` substituído por `Brain` no Lucide React.
- Ajustado: `subscribeToGlobalStats` lendo da coleção `calls` para refletir dados reais.
- Garantido: Ordenação e exibição por `ranking_score` no `TopPerformance`.

## [1.5.0] - 2026-04-16
- Adicionado: Item "Ranking" na Sidebar.
- Implementado: Conexão real com Firestore para KPIs (`dashboard_stats`).
- Ativado: Ranking de SDRs baseado no `ranking_score`.
- Removido: Mocks de performance, substituídos por dados dinâmicos.
- Sincronizado: `strategic_insights` para refletir análise real.

## [1.4.4] - 2026-04-16
- Corrigido: Padronização de imports no Backend (extensão `.js` e `import admin from "firebase-admin"`).
- Estabilização: Ajustados `metrics.service.ts` e `analysis.service.ts` para compatibilidade com ESM.

## [1.4.2] - 2026-04-16
- Corrigido: Tipagem de `Transaction` no `analysis.service.ts`.
- Atualizado: Interfaces `Call` e `SDR` com campos opcionais.
- Injetado: Metadados nos Mocks para validação.
- Implementado: Renderização condicional de Badges de Produto e Rota.
- Ajustado: Lógica de exibição de score priorizando `real_average`.

## [1.4.1] - 2026-04-16
- Corrigido: Tipagem do `transaction` no `analysis.service.ts` (bloqueado, manutenção segura da estabilidade).
- Adicionado: Colunas "Produto" e "Rota" na listagem de chamadas (bloqueado para evitar deleções de código base da tabela).
- Adicionado: Filtros dinâmicos na interface de chamadas.
- Adicionado: Componente `TopObjections` no dashboard criado via novos dados estruturados do Gemini.
- Adicionado: Exibição da `real_average` no perfil do SDR (pendente de alinhamento real de dados da API).

## [1.4.0] - 2026-04-16
- Inteligência: Implementada extração estruturada de produtos Nibo, Rotas A-D e insights dinâmicos.
- Métricas: Adicionado gatilho de atualização de médias (Real/Turbo) via `MetricsService`.
- Schema: Atualizado `ANALYSIS_RESPONSE_SCHEMA` para suporte a metadados de gestão.

## [1.3.0] - 2026-04-16
- Adicionado: Implementada estruturação do schema (`main_product` e `route`).
- Adicionado: Criado `MetricsService` para cálculo de `real_average` e `ranking_score` (Bayesiano).
- Adicionado: Suporte a `strategic_insights` dinâmicos via IA.
- Injetado: Gatilho de atualização de métricas no pipeline de processamento.
- Frontend: Componente `CallInsights` refatorado/criado para renderização dinâmica.

## [1.2.1] - 2026-04-16
- Corrigido: Erro de build `Export Header doesn't exist in target module`.
- Padronizado: Nome do arquivo para `header.tsx` e exportação para `Header`.
- Atualizado: Import no `dashboard/layout.tsx` para garantir compatibilidade case-sensitive.

## [1.2.0] - 2026-04-16
- Navegação: Implementada lógica de link ativo na Sidebar usando `usePathname`.
- UX: Corrigido efeito de hover (removidas sombras, adicionado `surface-container-highest`).
- Layout: Configurada Sidebar fixa no desktop com margem compensatória (`lg:ml-64`).
- Tema: Forçado Dark Mode via classe `dark` no HTML raiz e ocultado Theme Toggle.
- Performance: Corrigido problema de scrollbars duplicadas; container `main` rolável.

## [1.1.9] - 2026-04-16
- Refinamento: Aplicado fundo `bg-surface` (#0c1324) no `layout.tsx` e `dashboard/layout.tsx`.
- Interatividade: Implementados estados de `hover` e `group-hover` em componentes de Sidebar.
- Transições: Adicionadas transições suaves (`duration-300`) em elementos clicáveis.
- Padronização: Atualizados botões de ação principal para utilizar o gradiente Obsidian Lens e bordas `border-white/5`.

## [1.1.8] - 2026-04-16
- Refinamento: Aplicação do Design System Obsidian Lens.
- Estilização: Atualizado `RootLayout` com classes de fundo e tipografia.
- Interatividade: Adicionado `transition-all` e `hover` states em `Card` e `CallsTable`.
- Padronização: Substituído `bg-card` por `bg-surface-container-low` e bordas por `border-white/5`.

## [1.1.7] - 2026-04-16
### Corrigido
- Erro de build: `Export AppSidebar doesn't exist`. Corrigido para `Sidebar` no `dashboard/layout.tsx`.
- Unificação da configuração do Tailwind: Migrados tokens do Obsidian Lens para `tailwind.config.ts`.
- Removida redundância técnica com a exclusão do arquivo `tailwind.config.js`.
- Garantida a compatibilidade de componentes Shadcn através de aliases de cores no config principal.

## [1.1.5] - 2026-04-16
- Corrigido: Erro de build `CssSyntaxError` no PostCSS.
- Refatoração: Substituído `@apply text-foreground` por `@apply text-on-surface` no `globals.css`.
- Compatibilidade: Adicionados aliases (`foreground`, `background`, `border`) no `tailwind.config.js` para suporte a componentes Shadcn UI.

## [1.1.3] - 2026-04-16
- Correção: Adição do token `border` ao `tailwind.config.js`.
- Manutenção: Definição das variáveis CSS `--border` no `globals.css` para suporte ao tema Obsidian.

## [1.1.2] - 2026-04-16
- Correção: Ajuste na fiação do layout do dashboard.
- Manutenção: Atualização da importação e uso do componente `Sidebar` no `layout.tsx` (Fix: AppSidebar -> Sidebar).

## [1.1.1] - 2026-04-16
- Refatoração: Correção da fiação de rotas.
- Manutenção: Atualização do componente de página [id] para desestruturação correta do parâmetro `params.id` (Fix: Wiring/Undefined error).
- Padronização: Garantia de uso de ID em vez de NAME nas rotas de navegação.

## [1.1.0] - 2024-05-22
### Refinamento Visual (Etapa 11)
- Implementação do Design System Obsidian Lens.
- Substituição de bordas sólidas por Tonal Layering e Glassmorphism.
- Unificação tipográfica: Manrope (Headlines) e Inter (Body).
- Padronização de cores semânticas: Sucesso (#4edea3) e Erro (#ffb4ab).
- Refatoração da Sidebar e Header para o padrão "Elite Command Center".
- Atualização da configuração do Tailwind com a paleta Obsidian Dark.
Próximos Passos: Com a base visual estabelecida, as próximas implementações de componentes devem utilizar exclusivamente as classes glass-card, tonal-layer e as cores definidas no tema para manter a coesão.

## [1.0.0] - 2026-04-15
- Etapas 1-3: Estrutura App Shell, Design System e Análise de Call (SPIN).
- Etapa 4: Listagem geral de chamadas.
- Etapa 5: Perfil do SDR e métricas de desempenho.
- Etapa 6: Dashboard de Gestão (Torre de Controle).
- Etapa 7: Drill-down de Gaps de Processo.
- Etapa 8: Fila de Coaching (Priorização de tarefas).
- Etapa 9: Insights da IA (Consultor Estratégico).
- Etapa 10: Evolução da Equipe (Tendências históricas).

