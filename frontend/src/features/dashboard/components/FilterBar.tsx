import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const FilterBar = ({ onChange }: { onChange: (filters: any) => void }) => (
  <div className="flex gap-4 p-4 glass-card rounded-xl mb-8">
    <Select onValueChange={(v) => onChange({ period: v })} defaultValue="Tudo">
      <SelectTrigger className="w-40 bg-surface-container-highest border-none"><SelectValue placeholder="Período" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="Hoje">Hoje</SelectItem>
        <SelectItem value="7D">Últimos 7 Dias</SelectItem>
        <SelectItem value="30D">Últimos 30 Dias</SelectItem>
        <SelectItem value="Tudo">Todo o Período</SelectItem> {/* Adicionado 'Tudo' */}
        <SelectItem value="Custom" disabled>Personalizado</SelectItem> {/* Placeholder */}
      </SelectContent>
    </Select>
    <Select onValueChange={(v) => onChange({ route: v })} defaultValue="all">
      <SelectTrigger className="w-40 bg-surface-container-highest border-none"><SelectValue placeholder="Rota" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as Rotas</SelectItem>
        <SelectItem value="A">Rota A</SelectItem>
        <SelectItem value="B">Rota B</SelectItem>
        <SelectItem value="C">Rota C</SelectItem> {/* Adicionado 'Rota C' */}
      </SelectContent>
    </Select>
  </div>
);
