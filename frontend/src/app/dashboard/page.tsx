"use client";
import { useState } from "react";
import { FilterBar } from "@/features/dashboard/components/FilterBar";
import { TeamStats } from "@/features/dashboard/components/TeamStats";
import { TopPerformance } from "@/features/dashboard/components/TopPerformance";

export default function DashboardPage() {
  const [filters, setFilters] = useState({ period: 'Hoje', route: 'A' });
  
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="h1-elite">Intelligence Command</h1>
        <FilterBar onChange={setFilters} />
      </header>
      <TeamStats filters={filters} />
      <div className="grid grid-cols-3 gap-8 mt-8">
        <div className="col-span-2 glass-card p-8 rounded-xl h-96 flex items-center justify-center text-slate-500">
            Radar de Saúde (Dispersão Domínio vs Dor)
        </div>
        <TopPerformance />
      </div>
    </div>
  );
}