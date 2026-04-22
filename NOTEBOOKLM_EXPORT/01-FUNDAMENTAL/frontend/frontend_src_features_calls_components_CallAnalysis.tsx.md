# CallAnalysis.tsx

## Visão geral
- Caminho original: `frontend/src/features/calls/components/CallAnalysis.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **35**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallAnalysisHeader. Funções/classes detectadas: CallAnalysisHeader. Temas relevantes detectados: analysis, sdr. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CallAnalysisHeader`

## Funções e classes detectadas
- `CallAnalysisHeader`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
export const CallAnalysisHeader = ({ score, name, sdr }: any) => {
  return (
    <section className="glass-card rounded-2xl p-8 flex justify-between items-center relative overflow-hidden obsidian-glow">
      <div className="flex gap-8 items-center z-10">
        <div className="relative">
          <div className={`w-20 h-20 rounded-full border-4 ${score < 5 ? 'border-error/20' : 'border-secondary/20'} flex items-center justify-center bg-surface-dim`}>
            <span className={`text-2xl font-black font-headline ${score < 5 ? 'text-error' : 'text-secondary'}`}>
              {score}
            </span>
          </div>
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${score < 5 ? 'bg-error text-background' : 'bg-secondary text-background'}`}>
            Nota SPIN
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold font-headline text-white tracking-tight">{name}</h2>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${
              score < 5 ? 'bg-error/10 text-error border-error/20' : 'bg-secondary/10 text-secondary border-secondary/20'
            }`}>
              {score < 5 ? 'Reprovado' : 'Aprovado'}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium">SDR: {sdr}</p>
        </div>
      </div>
      
      <button className="bg-tertiary text-background hover:opacity-90 px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-tertiary/20">
        Ouvir Gravação
      </button>
    </section>
  );
};

```
