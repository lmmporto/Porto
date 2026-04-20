import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, User, CheckCircle } from "lucide-react"

interface CallHeaderProps {
  sdrName: string
  clientName: string
  date: string
  duration: string
  overallScore: number
  status: string
}

export function CallHeader({ sdrName, clientName, date, duration, overallScore, status }: CallHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {clientName}
          </h1>
          <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span className="font-medium text-foreground">{sdrName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>
      </div>
      
      <Card className="bg-primary/5 border-primary/20 shrink-0">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-sm font-medium text-muted-foreground">Score Geral</div>
          <Badge 
            variant={overallScore >= 70 ? "default" : "destructive"}
            className="text-xl px-4 py-1.5"
          >
            {overallScore}/100
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
