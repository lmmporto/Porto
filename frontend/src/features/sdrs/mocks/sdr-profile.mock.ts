import { CallListItem } from "@/features/calls/mocks/calls-list.mock"

export type SdrProfile = {
  id: string
  name: string
  role: string
  tenure: string
  stats: {
    avgSpinScore: number
    totalCalls: number
    approvalRate: number
  }
  insights: {
    strengths: string[]
    gaps: string[]
  }
  history: CallListItem[]
}

export const sdrProfileMock: SdrProfile = {
  id: "sdr-1",
  name: "João Silva",
  role: "SDR Pleno",
  tenure: "1 ano e 2 meses",
  stats: {
    avgSpinScore: 78,
    totalCalls: 45,
    approvalRate: 82,
  },
  insights: {
    strengths: ["Excelente Rapport", "Identificação rápida de problemas técnicos"],
    gaps: ["Aprofundamento em implicações financeiras", "Fechamento de próximos passos"]
  },
  history: [
    { id: "call-123", clientName: "TechCorp Solutions", sdrName: "João Silva", date: "24/10/2023", duration: "14:32", score: 78, status: "Analisada" },
    { id: "call-125", clientName: "StartUp Inc", sdrName: "João Silva", date: "25/10/2023", duration: "22:10", score: 45, status: "Analisada" },
  ]
}
