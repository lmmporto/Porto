# evolution-table.tsx

## Visão geral
- Caminho original: `frontend/src/features/evolution/components/evolution-table.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-component**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **27**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-component no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: EvolutionTable. Funções/classes detectadas: EvolutionTable. Dependências locais detectadas: @/components/ui/table. Temas relevantes detectados: calls, evolution. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
- `@/components/ui/table`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `@/components/ui/table`

## Exports detectados
- `EvolutionTable`

## Funções e classes detectadas
- `EvolutionTable`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `calls`
- `evolution`

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function EvolutionTable({ data }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mês</TableHead>
          <TableHead>Score Médio</TableHead>
          <TableHead>Taxa Aprovação</TableHead>
          <TableHead>Volume Calls</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item: any) => (
          <TableRow key={item.month}>
            <TableCell className="font-medium">{item.month}</TableCell>
            <TableCell>{item.avgSpinScore}</TableCell>
            <TableCell>{item.approvalRate}%</TableCell>
            <TableCell>{item.callVolume}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

```
