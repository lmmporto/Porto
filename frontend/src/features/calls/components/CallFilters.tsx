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
