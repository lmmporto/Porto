# sdr-leaderboard.tsx

## Visão geral
- Caminho original: `frontend/src/features/dashboard/components/sdr-leaderboard.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **32**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: SdrLeaderboard. Funções/classes detectadas: SdrLeaderboard. Dependências locais detectadas: @/components/ui/badge, @/components/ui/card. Temas relevantes detectados: coaching, sdr. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/badge`
- `@/components/ui/card`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/badge`
- `@/components/ui/card`

## Exports detectados
- `SdrLeaderboard`

## Funções e classes detectadas
- `SdrLeaderboard`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `coaching`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SdrLeaderboard({ topPerformers, needsCoaching }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Top Performers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {topPerformers.map((sdr: any) => (
            <div key={sdr.id} className="flex justify-between items-center p-2 border rounded">
              <span>{sdr.name}</span>
              <Badge>{sdr.score}/100</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader><CardTitle className="text-base text-destructive">SDRs em Alerta</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {needsCoaching.map((sdr: any) => (
            <div key={sdr.id} className="flex justify-between items-center p-2 border rounded">
              <span className="text-destructive font-medium">{sdr.name}</span>
              <Badge variant="destructive">{sdr.score}/100</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

```
