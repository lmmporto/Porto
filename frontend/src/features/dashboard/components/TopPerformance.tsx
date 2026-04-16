import Link from "next/link";

export const TopPerformance = ({ sdrs }: { sdrs: any[] }) => {
  return (
    <div className="glass-card p-8 rounded-xl obsidian-glow">
      <h3 className="label-elite mb-6">Top Performance</h3>
      <div className="space-y-6">
        {sdrs.map((sdr, index) => (
          <Link key={sdr.id} href={`/dashboard/sdrs/${sdr.id}`}>
            <div className="flex items-center justify-between group cursor-pointer tonal-layer p-2 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{sdr.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Ver Perfil</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-secondary">{sdr.ranking_score?.toFixed(1) || "0.0"}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
