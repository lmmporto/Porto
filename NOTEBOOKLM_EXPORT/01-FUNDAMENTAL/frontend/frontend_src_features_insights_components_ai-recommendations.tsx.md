# ai-recommendations.tsx

## Visão geral
- Caminho original: `frontend/src/features/insights/components/ai-recommendations.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **17**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: AiRecommendations. Funções/classes detectadas: AiRecommendations. Dependências locais detectadas: @/components/ui/alert. Dependências externas detectadas: lucide-react. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/alert`

## Dependências externas
- `lucide-react`

## Todos os imports detectados
- `@/components/ui/alert`
- `lucide-react`

## Exports detectados
- `AiRecommendations`

## Funções e classes detectadas
- `AiRecommendations`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lightbulb, AlertTriangle } from "lucide-react"

export function AiRecommendations({ recommendations }: any) {
  return (
    <div className="space-y-4">
      {recommendations.map((rec: any, i: number) => (
        <Alert key={i} variant={rec.type === 'warning' ? 'destructive' : 'default'}>
          {rec.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
          <AlertTitle>{rec.title}</AlertTitle>
          <AlertDescription>{rec.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

```
