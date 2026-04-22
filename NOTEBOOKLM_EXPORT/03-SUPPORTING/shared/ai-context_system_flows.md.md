# system_flows.md

## Visão geral
- Caminho original: `ai-context/system_flows.md`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **30**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Temas relevantes detectados: analysis, calls, dashboard, hubspot, ranking, sdr, stats, webhook.

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
- `hubspot`
- `ranking`
- `sdr`
- `stats`
- `webhook`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```md
# Fluxos principais

## Fluxo: Gatekeeper (Ingestão)
HubSpot Webhook -> processCall -> Validação ownerId (Lista de Elite) -> Análise -> Firestore.
- Chamadas de SDRs não autorizados são descartadas automaticamente na entrada (Gatekeeper).

## Fluxo: processamento de call

HubSpot envia webhook
↓
webhook.service recebe evento
↓
processCall busca dados da call
↓
download da gravação
↓
transcrição via Gemini
↓
análise da conversa
↓
resultado salvo no Firestore
↓
dashboard mostra análise

## Fluxo: Navegação e Consumo de Dados (Frontend)
O frontend consome o Firestore em tempo real (onSnapshot) com estratégia de leitura leve:
1. **Gestão (/dashboard):** Lê apenas o agregado `dashboard_stats` (KPIs globais).
2. **Ligações (/dashboard/calls):** Lê `calls_analysis` com projection (sem baixar transcrições) para a tabela.
3. **Análise Detalhada (/dashboard/calls/[id]):** Única rota que faz o download completo do JSON da call (Playbook, Resumo, Objeções).
4. **Ranking (/dashboard/ranking):** Lê a coleção `sdrs` ordenada por `ranking_score`.
```
