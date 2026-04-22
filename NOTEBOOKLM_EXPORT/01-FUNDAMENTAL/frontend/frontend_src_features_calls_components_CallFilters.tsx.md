# CallFilters.tsx

## Visão geral
- Caminho original: `frontend/src/features/calls/components/CallFilters.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **24**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallFilters. Funções/classes detectadas: CallFilters. Temas relevantes detectados: sdr. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CallFilters`

## Funções e classes detectadas
- `CallFilters`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
export const CallFilters = ({ onFilterChange }: any) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-surface-container-low rounded-2xl border border-white/5 mb-6">
      <div className="flex flex-col gap-1">
        <label className="label-elite">SDR</label>
        <select className="bg-surface-container-highest border-none rounded-lg text-xs text-on-surface focus:ring-primary">
          <option>Todos os SDRs</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="label-elite">Rota</label>
        <select className="bg-surface-container-highest border-none rounded-lg text-xs text-on-surface focus:ring-primary">
          <option value="A">Rota A (Inbound)</option>
          <option value="B">Rota B (Outbound)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="label-elite">Período</label>
        <input type="date" className="bg-surface-container-highest border-none rounded-lg text-xs text-on-surface" />
      </div>
    </div>
  );
};

```
