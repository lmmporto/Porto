# database_schema.md

## Visão geral
- Caminho original: `ai-context/database_schema.md`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **16**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Temas relevantes detectados: admin, analysis, calls, dashboard, email, firebase, insights, ranking, sdr, stats. Indícios de framework/arquitetura: firebase.

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
- `admin`
- `analysis`
- `calls`
- `dashboard`
- `email`
- `firebase`
- `insights`
- `ranking`
- `sdr`
- `stats`
- `summary`

## Indícios de framework/arquitetura
- `firebase`

## Código
```md
# Mapa de Dados - Firestore

## Coleções Principais
1. **calls_analysis**: Armazena o resultado da IA.
   - Campos chave: `nota_spin` (number), `rota` (A/B/C/D), `produto_principal` (string), `insights_estrategicos` (array de objetos), `playbook_detalhado` (array de objetos), `ownerEmail` (string).

2. **sdrs**: Perfil de performance do SDR.
   - Campos chave: `real_average`, `ranking_score`, `media_dor`, `media_dominio`, `recurrent_gaps` (mapa).

3. **dashboard_stats**: Agregados globais.
   - Documento `global_summary`: `total_calls`, `media_geral`, `taxa_aprovacao`, `duracao_media`, `recurrent_gaps` (mapa), `top_strengths` (mapa).

## Regras de Acesso
- A leitura é feita via Firebase Client SDK (onSnapshot).
- A escrita é restrita ao Backend (Admin SDK) para garantir integridade.

```
