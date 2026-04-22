# sdr-impact-list.tsx

## Visão geral
- Caminho original: `frontend/src/features/gaps/components/sdr-impact-list.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **19**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: SdrImpactList. Funções/classes detectadas: SdrImpactList. Dependências locais detectadas: @/components/ui/badge, @/components/ui/card. Temas relevantes detectados: sdr. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/badge`
- `@/components/ui/card`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/badge`
- `@/components/ui/card`

## Exports detectados
- `SdrImpactList`

## Funções e classes detectadas
- `SdrImpactList`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SdrImpactList({ sdrs }: { sdrs: { name: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">SDRs que precisam de foco</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {sdrs.map((sdr, i) => (
          <div key={i} className="flex justify-between items-center p-2 border rounded">
            <span className="font-medium">{sdr.name}</span>
            <Badge variant="outline">{sdr.count} ocorrências</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

```
