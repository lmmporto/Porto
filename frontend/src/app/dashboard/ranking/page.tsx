"use client";

import { useEffect, useState } from "react";
import { TopPerformance } from "@/features/dashboard/components/TopPerformance";
import { subscribeToRanking } from "@/features/dashboard/api/dashboard.service";

export default function RankingPage() {
  const [sdrs, setSdrs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToRanking(setSdrs);
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="h1-elite">Leaderboard</h2>
        <p className="text-on-surface-variant">Ranking de performance baseado na Média Turbo (Bayesiana).</p>
      </header>
      <div className="max-w-4xl">
        <TopPerformance sdrs={sdrs} />
      </div>
    </div>
  );
}
