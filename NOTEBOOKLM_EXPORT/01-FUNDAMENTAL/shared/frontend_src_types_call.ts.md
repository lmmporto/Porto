# call.ts

## Visão geral
- Caminho original: `frontend/src/types/call.ts`
- Domínio: **shared**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **type-definition**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **21**
- Imports detectados: **0**
- Exports detectados: **2**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como type-definition no domínio shared. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: Call, SDR. Temas relevantes detectados: ranking, sdr.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `Call`
- `SDR`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `ranking`
- `sdr`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export interface Call {
  id: string;
  sdrId: string;
  sdrName: string;
  clientName: string;
  date: string;
  score: number;
  duration: string;
  route?: 'A' | 'B' | 'C' | 'D';
  main_product?: string;
  objections?: string[];
}

export interface SDR {
  id: string;
  name: string;
  ranking_score: number;
  real_average?: number;
  callCount: number;
}

```
