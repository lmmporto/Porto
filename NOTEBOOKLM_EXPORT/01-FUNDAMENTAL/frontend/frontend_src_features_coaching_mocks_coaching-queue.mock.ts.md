# coaching-queue.mock.ts

## Visão geral
- Caminho original: `frontend/src/features/coaching/mocks/coaching-queue.mock.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **100**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **15**
- Imports detectados: **0**
- Exports detectados: **2**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio frontend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Exports detectados: CoachingTask, coachingQueueMock. Temas relevantes detectados: coaching, queue, sdr.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CoachingTask`
- `coachingQueueMock`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `coaching`
- `queue`
- `sdr`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
export type CoachingTask = {
  id: string
  callId: string
  clientName: string
  priority: "High" | "Medium" | "Low"
  reason: string
  status: "Pending" | "In Review" | "Completed"
}

export const coachingQueueMock: CoachingTask[] = [
  { id: "t1", callId: "call-125", clientName: "StartUp Inc", priority: "High", reason: "Score Crítico (< 50)", status: "Pending" },
  { id: "t2", callId: "call-127", clientName: "Finance Group", priority: "High", reason: "Falha Crítica de Implicação", status: "Pending" },
  { id: "t3", callId: "call-123", clientName: "TechCorp Solutions", priority: "Medium", reason: "SDR em declínio", status: "In Review" },
]

```
