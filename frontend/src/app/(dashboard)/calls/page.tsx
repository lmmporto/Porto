import { callsListMock } from "@/features/calls/mocks/calls-list.mock"
import { CallsTable } from "@/features/calls/components/calls-table"

export default function CallsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chamadas</h1>
          <p className="text-muted-foreground">
            Gerencie e analise o desempenho das suas calls de vendas.
          </p>
        </div>
      </div>
      
      <CallsTable calls={callsListMock} />
    </div>
  )
}
