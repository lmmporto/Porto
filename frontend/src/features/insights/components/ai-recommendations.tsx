import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lightbulb, AlertTriangle } from "lucide-react"

export function AiRecommendations({ recommendations }: any) {
  return (
    <div className="space-y-4">
      {recommendations.map((rec: any, i: number) => (
        <Alert key={i} variant={rec.type === 'warning' ? 'destructive' : 'default'}>
          {rec.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
          <AlertTitle>{rec.title}</AlertTitle>
          <AlertDescription>{rec.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
