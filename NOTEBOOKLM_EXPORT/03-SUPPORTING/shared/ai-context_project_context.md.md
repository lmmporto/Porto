# project_context.md

## Visão geral
- Caminho original: `ai-context/project_context.md`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **71**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Temas relevantes detectados: analysis, calls, dashboard, firebase, hubspot, insights, ranking, sdr, stats, webhook. Indícios de framework/arquitetura: express, firebase.

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
- `calls`
- `dashboard`
- `firebase`
- `hubspot`
- `insights`
- `ranking`
- `sdr`
- `stats`
- `webhook`

## Indícios de framework/arquitetura
- `express`
- `firebase`

## Código
```md
# Projeto: SDR Call Analyzer

## Objetivo
Sistema que analisa chamadas de SDR automaticamente para gerar insights de vendas baseados em SPIN Selling.

## Stack

Backend
- Node.js
- Express
- TypeScript
- Firestore

Frontend
- Next.js
- Shadcn UI
- Vercel

Integrações
- HubSpot API
- Google Gemini (transcrição e análise)
- Firebase / Firestore

## Pipeline principal

HubSpot webhook
↓
download da gravação
↓
transcrição do áudio
↓
análise da conversa
↓
geração de insights
↓
armazenamento no Firestore
↓
visualização no dashboard

## Entidades principais e Consumo (Leitura Leve)
O dashboard não consome a coleção calls_analysis diretamente para KPIs, ele consome apenas os agregados pré-calculados em dashboard_stats para garantir performance.

## Entidades principais

Call
- ligação individual

SDR
- vendedor que realiza a chamada

Analysis
- resultado da análise da call

Transcript
- texto transcrito do áudio

## Objetivo do produto

Ajudar SDRs a melhorar performance identificando:

- falhas de abordagem
- oportunidades de pergunta
- aderência ao SPIN selling

## Regras de Negócio e Inteligência (Nibo)
- **Catálogo de Produtos:** A IA identifica o produto foco (Nibo Obrigações Plus, Nibo WhatsApp, Nibo Conciliador, Nibo Emissor, Ferramenta do Radar e CAC).
- **Rotas de Qualificação:** Chamadas são classificadas em Rota A, B, C ou D (Descarte).
- **Dualidade de Métricas:** 
  - `real_average`: Média aritmética (usada pela Gestão).
  - `ranking_score`: Média Bayesiana/Turbo (usada para gamificação no Ranking de SDRs).
- **Insights Dinâmicos:** A IA gera um array mutável `insights_estrategicos` (label, value, type) em vez de métricas fixas.
```
