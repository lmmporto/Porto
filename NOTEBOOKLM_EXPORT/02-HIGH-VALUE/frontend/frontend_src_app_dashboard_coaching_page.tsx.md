# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/coaching/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **20**
- Imports detectados: **3**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: CoachingQueuePage, function. Funções/classes detectadas: CoachingQueuePage. Dependências locais detectadas: @/components/ui/card, @/features/coaching/components/coaching-priority-list, @/features/coaching/mocks/coaching-queue.mock. Temas relevantes detectados: coaching, queue. Indícios de framework/arquitetura: react/tsx, next-app-router.

## Dependências locais
- `@/components/ui/card`
- `@/features/coaching/components/coaching-priority-list`
- `@/features/coaching/mocks/coaching-queue.mock`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/card`
- `@/features/coaching/components/coaching-priority-list`
- `@/features/coaching/mocks/coaching-queue.mock`

## Exports detectados
- `CoachingQueuePage`
- `function`

## Funções e classes detectadas
- `CoachingQueuePage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `coaching`
- `queue`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`

## Código
```tsx
import { coachingQueueMock } from "@/features/coaching/mocks/coaching-queue.mock"
import { CoachingPriorityList } from "@/features/coaching/components/coaching-priority-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CoachingQueuePage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <h1 className="text-2xl font-bold">Fila de Coaching</h1>
      <Card>
        <CardHeader>
          <CardTitle>Chamadas Prioritárias</CardTitle>
        </CardHeader>
        <CardContent>
          <CoachingPriorityList tasks={coachingQueueMock} />
        </CardContent>
      </Card>
    </div>
  )
}

```
