# architecture.md

## Visão geral
- Caminho original: `ai-context/architecture.md`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **68**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Temas relevantes detectados: analysis, dashboard, firebase, hubspot, metrics, ranking, worker. Indícios de framework/arquitetura: firebase.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `dashboard`
- `firebase`
- `hubspot`
- `metrics`
- `ranking`
- `worker`

## Indícios de framework/arquitetura
- `firebase`

## Código
```md
# Arquitetura do sistema

## Backend

Estrutura principal

routes/
Recebem requisições HTTP

controllers/
Traduzem requisições em operações do sistema

services/
Executam regras de negócio

repositories/
Leitura e escrita no Firestore

integrations/
Integrações externas

- HubSpot
- Gemini
- Firebase

workers/
Processamento assíncrono

scripts/
Ferramentas operacionais e manutenção

utils/
Funções utilitárias

types/
Tipos TypeScript compartilhados

## Serviços de Dados e Inteligência (Backend)
- `metrics.service.ts`: Orquestra o cálculo das métricas Real (Aritmética) e Turbo (Bayesiana).
- `analysis.service.ts`: Motor de IA que processa a call e retorna o JSON estruturado.

## Frontend

app/
Rotas e páginas

components/
Componentes reutilizáveis

features/
Funcionalidades organizadas por domínio

services/
Comunicação com backend

hooks/
Hooks customizados

lib/
Helpers e utilidades

## Conectividade (Frontend)
- `lib/firebase.ts`: Inicialização do Firebase Client SDK.
- `features/dashboard/api/dashboard.service.ts`: Abstração de leitura via onSnapshot para KPIs e Ranking.

### Design System
- Padrão visual: Obsidian Lens (Dark Mode, Glassmorphism, Tonal Layering).
- Cores semânticas estritas: Emerald (Sucesso), Rose (Alerta), Indigo (Ação).
```
