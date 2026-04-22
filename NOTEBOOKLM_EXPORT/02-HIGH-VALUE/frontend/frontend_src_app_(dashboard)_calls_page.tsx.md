# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/(dashboard)/calls/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **20**
- Imports detectados: **2**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: CallsPage, function. Funções/classes detectadas: CallsPage. Dependências locais detectadas: @/features/calls/components/calls-table, @/features/calls/mocks/calls-list.mock. Temas relevantes detectados: calls. Indícios de framework/arquitetura: react/tsx, next-app-router.

## Dependências locais
- `@/features/calls/components/calls-table`
- `@/features/calls/mocks/calls-list.mock`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/features/calls/components/calls-table`
- `@/features/calls/mocks/calls-list.mock`

## Exports detectados
- `CallsPage`
- `function`

## Funções e classes detectadas
- `CallsPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`

## Código
```tsx
import { callsListMock } from "@/features/calls/mocks/calls-list.mock"
import { CallsTable } from "@/features/calls/components/calls-table"

export default function CallsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chamadas</h1>
          <p className="text-muted-foreground">
            Gerencie e analise o desempenho das suas calls de vendas.
          </p>
        </div>
      </div>
      
      <CallsTable calls={callsListMock} />
    </div>
  )
}

```
