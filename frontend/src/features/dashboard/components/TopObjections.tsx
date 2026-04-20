export const TopObjections = ({ objections }: { objections: { label: string, count: number }[] }) => {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="label-elite mb-6">Top 3 Objeções Detectadas</h3>
      <div className="space-y-4">
        {objections.slice(0, 3).map((obj, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-white/5">
            <span className="text-sm font-medium">{obj.label}</span>
            <span className="text-xs font-black text-tertiary bg-tertiary/10 px-2 py-1 rounded">
              {obj.count}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
