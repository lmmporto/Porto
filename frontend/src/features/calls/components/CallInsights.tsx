export const CallInsights = ({ analysis }: { analysis: any }) => {
  const insights: Array<{ label: string; value: string; type: 'positive' | 'negative' | 'neutral' }> =
    Array.isArray(analysis?.insights_estrategicos)
      ? analysis.insights_estrategicos.filter(
          (i: any): i is { label: string; value: string; type: 'positive' | 'negative' | 'neutral' } =>
            typeof i === 'object' &&
            i !== null &&
            typeof i.label === 'string' &&
            typeof i.value === 'string' &&
            ['positive', 'negative', 'neutral'].includes(i.type)
        )
      : [];

  return (
    <>
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, index) => (
            <div key={index} className="glass-card p-6 rounded-xl obsidian-glow border-t-2 transition-all"
                 style={{ borderTopColor: insight.type === 'positive' ? '#4edea3' : insight.type === 'negative' ? '#ffb4ab' : '#94a3b8' }}>
              <div className="flex justify-between items-start mb-4">
                <span className="label-elite">{insight.label}</span>
                <span className={insight.type === 'positive' ? 'text-secondary' : insight.type === 'negative' ? 'text-error' : 'text-slate-400'}>
                  {insight.type === 'positive' ? '↑' : insight.type === 'negative' ? '↓' : '→'}
                </span>
              </div>
              <div className="text-3xl font-black font-headline text-on-surface">{insight.value}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
