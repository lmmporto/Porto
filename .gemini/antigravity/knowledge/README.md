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

## 💡 Decisões Importantes
- **Metodologia SPIN**: A análise de IA é estritamente orientada a identificar perguntas de Situação, Problema, Implicação e Necessidade de Solução.
- **Métrica Dual**: 
    - `real_average`: Média aritmética simples para relatórios gerenciais.
    - `ranking_score`: Média Bayesiana ("Turbo") para o Ranking, evitando que SDRs com poucas calls (ex: 1 call nota 10) dominem o topo injustamente.
- **Pipeline Unificado**: Optou-se por usar o Gemini para transcrição e análise simultânea, reduzindo latência e custo em comparação ao uso de modelos separados (ex: Whisper + GPT).
- **Hospedagem**: Backend no Render (pela facilidade com Node/Express) e Frontend na Vercel (otimização Next.js).

---
*Documentação gerada automaticamente pela Antigravity para referência contínua.*
