# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/gaps/[id]/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **29**
- Imports detectados: **7**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: GapDetailPage, function. Funções/classes detectadas: GapDetailPage. Dependências locais detectadas: @/components/ui/button, @/features/calls/components/calls-table, @/features/gaps/components/gap-analysis-header, @/features/gaps/components/sdr-impact-list, @/features/gaps/mocks/gap-detail.mock. Dependências externas detectadas: lucide-react, next/link. Temas relevantes detectados: analysis, calls, dashboard, sdr. Indícios de framework/arquitetura: react/tsx, next-app-router.

## Dependências locais
- `@/components/ui/button`
- `@/features/calls/components/calls-table`
- `@/features/gaps/components/gap-analysis-header`
- `@/features/gaps/components/sdr-impact-list`
- `@/features/gaps/mocks/gap-detail.mock`

## Dependências externas
- `lucide-react`
- `next/link`

## Todos os imports detectados
- `@/components/ui/button`
- `@/features/calls/components/calls-table`
- `@/features/gaps/components/gap-analysis-header`
- `@/features/gaps/components/sdr-impact-list`
- `@/features/gaps/mocks/gap-detail.mock`
- `lucide-react`
- `next/link`

## Exports detectados
- `GapDetailPage`
- `function`

## Funções e classes detectadas
- `GapDetailPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `calls`
- `dashboard`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`

## Código
```tsx
import { gapDetailMock } from "@/features/gaps/mocks/gap-detail.mock"
import { GapAnalysisHeader } from "@/features/gaps/components/gap-analysis-header"
import { SdrImpactList } from "@/features/gaps/components/sdr-impact-list"
import { CallsTable } from "@/features/calls/components/calls-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function GapDetailPage({ params }: { params: { id: string } }) {
  const data = gapDetailMock

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <Link href="/dashboard">
        <Button variant="ghost" className="pl-0"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar ao Dashboard</Button>
      </Link>
      
      <GapAnalysisHeader {...data} />
      
      <SdrImpactList sdrs={data.mostAffectedSDRs} />
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exemplos para treinamento</h2>
        <CallsTable calls={data.exampleCalls} />
      </div>
    </div>
  )
}

```
