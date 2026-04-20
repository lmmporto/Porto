export type CallStatus = "Analisada" | "Processando" | "Falha"

export type CallListItem = {
  id: string
  clientName: string
  sdrName: string
  date: string
  duration: string
  score: number | null
  status: CallStatus
}

export const callsListMock: CallListItem[] =[
  {
    id: "call-123",
    clientName: "TechCorp Solutions",
    sdrName: "João Silva",
    date: "24/10/2023",
    duration: "14:32",
    score: 78,
    status: "Analisada",
  },
  {
    id: "call-124",
    clientName: "Global Industries",
    sdrName: "Maria Souza",
    date: "24/10/2023",
    duration: "08:15",
    score: 92,
    status: "Analisada",
  },
  {
    id: "call-125",
    clientName: "StartUp Inc",
    sdrName: "João Silva",
    date: "25/10/2023",
    duration: "22:10",
    score: 45,
    status: "Analisada",
  },
  {
    id: "call-126",
    clientName: "Mega Retail",
    sdrName: "Pedro Santos",
    date: "25/10/2023",
    duration: "12:05",
    score: null,
    status: "Processando",
  },
  {
    id: "call-127",
    clientName: "Finance Group",
    sdrName: "Maria Souza",
    date: "26/10/2023",
    duration: "05:50",
    score: null,
    status: "Falha",
  },
]
