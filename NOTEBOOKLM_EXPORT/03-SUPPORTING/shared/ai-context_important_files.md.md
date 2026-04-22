# important_files.md

## Visão geral
- Caminho original: `ai-context/important_files.md`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **34**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Temas relevantes detectados: analysis, calls, dashboard, firebase, hubspot, metrics, sdr, worker. Indícios de framework/arquitetura: firebase.

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
- `metrics`
- `sdr`
- `worker`

## Indícios de framework/arquitetura
- `firebase`

## Código
```md
# Arquivos importantes do sistema

api-server/src/routes/calls.ts
Define endpoints de chamadas.

api-server/src/services/processCall.ts
Pipeline principal de processamento da chamada.

api-server/src/services/analysis.service.ts
Executa análise da chamada.

api-server/src/integrations/hubspot.ts
Comunicação com HubSpot.

api-server/src/services/transcription.service.ts
Responsável pela transcrição do áudio.

api-server/src/workers/worker.service.ts
Executa tarefas assíncronas.

frontend/src/app/dashboard
Interface principal do dashboard.

frontend/src/features/calls
Componentes relacionados às chamadas.

api-server/src/services/metrics.service.ts
Calcula e atualiza as médias (Real e Turbo) dos SDRs no Firestore.

frontend/src/lib/firebase.ts
Inicializa o Firebase Client SDK para conexões em tempo real no navegador.

frontend/src/features/dashboard/api/dashboard.service.ts
Serviço de leitura de agregados e KPIs para o painel de gestão.
```
