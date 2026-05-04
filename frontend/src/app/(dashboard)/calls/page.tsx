"use client";

import { useState } from "react"
import { callsListMock } from "@/features/calls/mocks/calls-list.mock"
import { CallsTable } from "@/features/calls/components/calls-table"

export default function CallsPage() {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

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
      
      <CallsTable 
        calls={callsListMock} 
        isLoading={isLoading}
        page={page}
        hasNextPage={hasNextPage}
        onNextPage={() => setPage((p) => p + 1)}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
      />
    </div>
  )
}
