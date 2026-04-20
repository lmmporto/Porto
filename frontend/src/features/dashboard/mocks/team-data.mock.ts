export const teamDataMock = {
  kpis: {
    totalCalls: 142,
    avgScore: 68,
    approvalRate: 58,
  },
  leaderboard: {
    topPerformers: [
      { id: "sdr-2", name: "Maria Souza", score: 92 },
      { id: "sdr-3", name: "Pedro Santos", score: 85 },
    ],
    needsCoaching: [
      { id: "sdr-1", name: "João Silva", score: 55 },
      { id: "sdr-4", name: "Ana Costa", score: 48 },
    ]
  },
  spinDistribution: [
    { label: "Situação", value: 85 },
    { label: "Problema", value: 70 },
    { label: "Implicação", value: 45 },
    { label: "Necessidade", value: 30 },
  ]
}
