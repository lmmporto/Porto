# calls-table.tsx

## Visão geral
- Caminho original: `frontend/src/features/calls/components/calls-table.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **36**
- Imports detectados: **0**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: CallsTable. Funções/classes detectadas: CallsTable. Temas relevantes detectados: calls, sdr. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
- `CallsTable`

## Funções e classes detectadas
- `CallsTable`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `sdr`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
export const CallsTable = ({ calls }: { calls: any[] }) => (
  <table className="w-full">
    <thead>
      <tr className="bg-surface-container-low/50">
        <th className="px-6 py-4 label-elite">SDR / Lead</th>
        <th className="px-6 py-4 label-elite">Produto</th>
        <th className="px-6 py-4 label-elite text-center">Rota</th>
        <th className="px-6 py-4 label-elite text-center">Score</th>
      </tr>
    </thead>
    <tbody>
      {calls.map((call) => (
        <tr key={call.id} className="tonal-row group border-b border-white/5">
          <td className="px-6 py-4">
            <div className="font-bold text-sm">{call.sdrName}</div>
            <div className="text-xs text-slate-500">{call.clientName}</div>
          </td>
          <td className="px-6 py-4">
            {call.main_product ? (
              <span className="px-2 py-1 rounded-md bg-surface-container-highest text-[10px] font-bold text-on-surface-variant border border-white/5">
                {call.main_product}
              </span>
            ) : <span className="text-slate-600 text-[10px]">---</span>}
          </td>
          <td className="px-6 py-4 text-center">
            {call.route ? (
              <span className="text-xs font-mono font-bold text-primary">{call.route}</span>
            ) : <span className="text-slate-600">--</span>}
          </td>
          <td className="px-6 py-4 text-center font-black text-secondary">{call.score}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

```
