# coaching-priority-list.tsx

## Visão geral
- Caminho original: `frontend/src/features/coaching/components/coaching-priority-list.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **41**
- Imports detectados: **5**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CoachingPriorityList. Funções/classes detectadas: CoachingPriorityList. Dependências locais detectadas: ../mocks/coaching-queue.mock, @/components/ui/badge, @/components/ui/button, @/components/ui/table. Dependências externas detectadas: next/link. Temas relevantes detectados: calls, coaching, dashboard, queue. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `../mocks/coaching-queue.mock`
- `@/components/ui/badge`
- `@/components/ui/button`
- `@/components/ui/table`

## Dependências externas
- `next/link`

## Todos os imports detectados
- `../mocks/coaching-queue.mock`
- `@/components/ui/badge`
- `@/components/ui/button`
- `@/components/ui/table`
- `next/link`

## Exports detectados
- `CoachingPriorityList`

## Funções e classes detectadas
- `CoachingPriorityList`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `coaching`
- `dashboard`
- `queue`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { CoachingTask } from "../mocks/coaching-queue.mock"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CoachingPriorityList({ tasks }: { tasks: CoachingTask[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prioridade</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Motivo do Alerta</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <Badge variant={task.priority === "High" ? "destructive" : "secondary"}>
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{task.clientName}</TableCell>
            <TableCell>{task.reason}</TableCell>
            <TableCell>{task.status}</TableCell>
            <TableCell>
              <Button asChild size="sm">
                <Link href={`/dashboard/calls/${task.callId}`}>Revisar Agora</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

```
