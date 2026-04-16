import { coachingQueueMock } from "@/features/coaching/mocks/coaching-queue.mock"
import { CoachingPriorityList } from "@/features/coaching/components/coaching-priority-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CoachingQueuePage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <h1 className="text-2xl font-bold">Fila de Coaching</h1>
      <Card>
        <CardHeader>
          <CardTitle>Chamadas Prioritárias</CardTitle>
        </CardHeader>
        <CardContent>
          <CoachingPriorityList tasks={coachingQueueMock} />
        </CardContent>
      </Card>
    </div>
  )
}
