export const CallInsights = ({ analysis }: { analysis: any }) => {
  const insights = analysis?.insights_estrategicos || [];

  if (insights.length === 0) return <div className="text-slate-500 italic">Nenhum insight estratégico gerado.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {insights.map((insight: any, index: number) => (
        <div key={index} className="glass-card p-6 rounded-xl obsidian-glow border-t-2 transition-all"
             style={{ borderTopColor: insight.type === 'positive' ? '#4edea3' : '#ffb4ab' }}>
          <div className="flex justify-between items-start mb-4">
            <span className="label-elite">{insight.label}</span>
            <span className={insight.type === 'positive' ? 'text-secondary' : 'text-error'}>
              {insight.type === 'positive' ? '↑' : '↓'}
            </span>
          </div>
          <div className="text-3xl font-black font-headline text-on-surface">{insight.value}</div>
        </div>
      ))}
    </div>
  );
};
