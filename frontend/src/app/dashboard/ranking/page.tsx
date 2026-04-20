"use client";

import { TopPerformance } from "@/features/dashboard/components/TopPerformance";

export default function RankingPage() {
  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="h1-elite">Leaderboard</h2>
        <p className="text-on-surface-variant">Ranking gamificado baseado na consistência e volume (Média Turbo).</p>
      </header>
      <div className="max-w-4xl">
        <TopPerformance /> {/* Tarefa Única: Chamando sem a prop filters */}
      </div>
    </div>
  );
}
