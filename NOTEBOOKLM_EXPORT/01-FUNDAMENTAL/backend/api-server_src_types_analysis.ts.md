# analysis.ts

## Visão geral
- Caminho original: `api-server/src/types/analysis.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **type-definition**
- Criticidade: **important**
- Score de importância: **118**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **25**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como type-definition no domínio backend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: AnalysisResult. Temas relevantes detectados: analysis, summary.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `AnalysisResult`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `summary`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export interface AnalysisResult {
  executiveSummary: string;
  mainDifficulty: string;
  recommendedAction: string;
  strengths: string[];
  
  managementData: {
    route: 'A' | 'B' | 'C' | 'D';
    product: string;
    competitors: string[];
    objections: string[];
    spinCounts: {
      situation: number;
      problem: number;
      implication: number;
      needPayoff: number;
    };
  };
  
  spinScore: {
    overall: number;
  };
  status: 'Aprovado' | 'Reprovado' | 'Em Análise';
}

```
