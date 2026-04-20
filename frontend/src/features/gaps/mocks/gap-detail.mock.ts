import { CallListItem } from "@/features/calls/mocks/calls-list.mock"

export type GapDetailData = {
  id: string
  name: string
  description: string
  impact: string
  incidence: number
  mostAffectedSDRs: { name: string; count: number }[]
  exampleCalls: CallListItem[]
}

export const gapDetailMock: GapDetailData = {
  id: "implication-questions",
  name: "Baixa exploração de Implicação",
  description: "As perguntas de Implicação (I do SPIN) conectam a dor do cliente ao impacto negativo no negócio. Sem elas, o cliente percebe o problema, mas não sente urgência em resolvê-lo.",
  impact: "SDRs que não exploram implicações frequentemente perdem o controle da oportunidade no estágio de diagnóstico, resultando em ciclos de vendas longos.",
  incidence: 72,
  mostAffectedSDRs: [
    { name: "João Silva", count: 12 },
    { name: "Ana Costa", count: 8 },
  ],
  exampleCalls: [
    { id: "call-123", clientName: "TechCorp Solutions", sdrName: "João Silva", date: "24/10/2023", duration: "14:32", score: 78, status: "Analisada" },
  ]
}
