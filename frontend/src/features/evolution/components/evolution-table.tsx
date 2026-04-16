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
