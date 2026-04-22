# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/evolution/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **23**
- Imports detectados: **4**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: EvolutionPage, function. Funções/classes detectadas: EvolutionPage. Dependências locais detectadas: @/components/ui/card, @/features/evolution/components/evolution-chart, @/features/evolution/components/evolution-table, @/features/evolution/mocks/evolution-data.mock. Temas relevantes detectados: evolution. Indícios de framework/arquitetura: react/tsx, next-app-router.

## Dependências locais
- `@/components/ui/card`
- `@/features/evolution/components/evolution-chart`
- `@/features/evolution/components/evolution-table`
- `@/features/evolution/mocks/evolution-data.mock`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/card`
- `@/features/evolution/components/evolution-chart`
- `@/features/evolution/components/evolution-table`
- `@/features/evolution/mocks/evolution-data.mock`

## Exports detectados
- `EvolutionPage`
- `function`

## Funções e classes detectadas
- `EvolutionPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `evolution`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`

## Código
```tsx
import { evolutionDataMock } from "@/features/evolution/mocks/evolution-data.mock"
import { EvolutionChart } from "@/features/evolution/components/evolution-chart"
import { EvolutionTable } from "@/features/evolution/components/evolution-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EvolutionPage() {
  const data = evolutionDataMock
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <h1 className="text-2xl font-bold">Evolução da Equipe</h1>
      
      <EvolutionChart data={data} />
      
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico Detalhado</CardTitle></CardHeader>
        <CardContent>
          <EvolutionTable data={data} />
        </CardContent>
      </Card>
    </div>
  )
}

```
