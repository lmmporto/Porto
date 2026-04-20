import { CoachingTask } from "../mocks/coaching-queue.mock"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CoachingPriorityList({ tasks }: { tasks: CoachingTask[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prioridade</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Motivo do Alerta</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <Badge variant={task.priority === "High" ? "destructive" : "secondary"}>
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{task.clientName}</TableCell>
            <TableCell>{task.reason}</TableCell>
            <TableCell>{task.status}</TableCell>
            <TableCell>
              <Button asChild size="sm">
                <Link href={`/dashboard/calls/${task.callId}`}>Revisar Agora</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
