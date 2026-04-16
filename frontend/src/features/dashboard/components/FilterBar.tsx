import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const FilterBar = ({ onChange }: { onChange: (filters: any) => void }) => (
  <div className="flex gap-4 p-4 glass-card rounded-xl mb-8">
    <Select onValueChange={(v) => onChange({ period: v })}>
      <SelectTrigger className="w-40 bg-surface-container-highest border-none"><SelectValue placeholder="Período" /></SelectTrigger>
      <SelectContent><SelectItem value="Hoje">Hoje</SelectItem><SelectItem value="7D">7 Dias</SelectItem><SelectItem value="30D">30 Dias</SelectItem></SelectContent>
    </Select>
    <Select onValueChange={(v) => onChange({ route: v })}>
      <SelectTrigger className="w-40 bg-surface-container-highest border-none"><SelectValue placeholder="Rota" /></SelectTrigger>
      <SelectContent><SelectItem value="A">Rota A</SelectItem><SelectItem value="B">Rota B</SelectItem></SelectContent>
    </Select>
  </div>
);
