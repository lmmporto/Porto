# coaching-timeline.tsx

## Visão geral
- Caminho original: `frontend/src/features/calls/components/coaching-timeline.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **90**
- Imports detectados: **5**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CoachingTimeline. Funções/classes detectadas: CoachingTimeline. Dependências locais detectadas: ../mocks/call-detail.mock, @/components/ui/accordion, @/components/ui/badge, @/components/ui/card. Dependências externas detectadas: lucide-react. Temas relevantes detectados: coaching. Indícios de framework/arquitetura: react/tsx, client-component.

## Dependências locais
- `../mocks/call-detail.mock`
- `@/components/ui/accordion`
- `@/components/ui/badge`
- `@/components/ui/card`

## Dependências externas
- `lucide-react`

## Todos os imports detectados
- `../mocks/call-detail.mock`
- `@/components/ui/accordion`
- `@/components/ui/badge`
- `@/components/ui/card`
- `lucide-react`

## Exports detectados
- `CoachingTimeline`

## Funções e classes detectadas
- `CoachingTimeline`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `coaching`

## Indícios de framework/arquitetura
- `react/tsx`
- `client-component`

## Código
```tsx
"use client"

import { CoachingEvent } from "../mocks/call-detail.mock"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, ArrowUpCircle, MessageSquare } from "lucide-react"

interface CoachingTimelineProps {
  events: CoachingEvent[]
}

const typeConfig = {
  praise: { icon: CheckCircle2, color: "text-status-success" },
  improvement: { icon: ArrowUpCircle, color: "text-status-pending" },
  attention: { icon: AlertTriangle, color: "text-status-error" },
}

export function CoachingTimeline({ events }: CoachingTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Coaching por Timestamp</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {events.map((event) => {
            const Config = typeConfig[event.type]
            const Icon = Config.icon

            // Cria um snippet curto para o título do accordion
            const shortSnippet = event.snippet.length > 60 
              ? `${event.snippet.substring(0, 60)}...` 
              : event.snippet

            return (
              <AccordionItem
                key={event.id}
                value={event.id}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 text-left w-full pr-4">
                    <Badge variant="secondary" className="font-mono text-sm shrink-0">
                      {event.timestamp}
                    </Badge>
                    <Icon className={`h-4 w-4 shrink-0 ${Config.color}`} />
                    <span className="text-sm font-medium text-muted-foreground truncate">
                      "{shortSnippet}"
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-4">
                  
                  {/* Transcrição Completa do Momento */}
                  <div className="bg-muted/50 p-4 rounded-md border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {event.speaker} disse:
                      </span>
                    </div>
                    <p className="text-sm italic text-foreground">"{event.snippet}"</p>
                  </div>

                  {/* Recomendação da IA */}
                  <div className="pl-2 border-l-2 border-primary">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                      Recomendação da IA
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {event.aiRecommendation}
                    </p>
                  </div>

                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}

```
