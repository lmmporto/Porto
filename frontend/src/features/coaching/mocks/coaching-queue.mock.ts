export type CoachingTask = {
  id: string
  callId: string
  clientName: string
  priority: "High" | "Medium" | "Low"
  reason: string
  status: "Pending" | "In Review" | "Completed"
}

export const coachingQueueMock: CoachingTask[] = [
  { id: "t1", callId: "call-125", clientName: "StartUp Inc", priority: "High", reason: "Score Crítico (< 50)", status: "Pending" },
  { id: "t2", callId: "call-127", clientName: "Finance Group", priority: "High", reason: "Falha Crítica de Implicação", status: "Pending" },
  { id: "t3", callId: "call-123", clientName: "TechCorp Solutions", priority: "Medium", reason: "SDR em declínio", status: "In Review" },
]
