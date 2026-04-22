# TopObjections.tsx

## Visão geral
- Caminho original: `frontend/src/features/dashboard/components/TopObjections.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **18**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: TopObjections. Funções/classes detectadas: TopObjections. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `TopObjections`

## Funções e classes detectadas
- `TopObjections`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
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

```
