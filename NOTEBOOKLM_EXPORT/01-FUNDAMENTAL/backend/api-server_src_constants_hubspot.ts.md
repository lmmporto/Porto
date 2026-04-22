# hubspot.ts

## Visão geral
- Caminho original: `api-server/src/constants/hubspot.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **constant**
- Criticidade: **important**
- Score de importância: **118**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **11**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como constant no domínio backend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: HUBSPOT_CALL_PROPERTIES. Temas relevantes detectados: hubspot.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `HUBSPOT_CALL_PROPERTIES`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `hubspot`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export const HUBSPOT_CALL_PROPERTIES = [
  'hs_call_duration',
  'hs_call_recording_url',
  'hs_call_transcript',
  'hubspot_owner_id',
  'hs_call_title',
  'hs_call_status',
  'hs_timestamp',
  'hs_createdate'
].join(',');

```
