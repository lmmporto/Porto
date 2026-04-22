# CallInsights.tsx

## Visão geral
- Caminho original: `frontend/src/features/calls/components/CallInsights.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **23**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallInsights. Funções/classes detectadas: CallInsights. Temas relevantes detectados: analysis, insights. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CallInsights`

## Funções e classes detectadas
- `CallInsights`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `insights`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
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

```
