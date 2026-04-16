import React from "react";
import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";

export const CallRow = ({ call }: { call: any }) => {
  return (
    <Link href={`/dashboard/calls/${call.id}`}>
      <div className="group flex items-center justify-between p-5 rounded-2xl bg-surface-container-low border border-white/5 hover:bg-surface-container-highest hover:border-primary/30 transition-all duration-300 cursor-pointer mb-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Score</span>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
              <span className="text-sm font-black text-secondary">{call.nota_spin || call.score}</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
              {call.clientName || "Lead Nibo"}
            </h4>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-bold text-on-surface-variant border border-white/5">
                {call.produto_principal || call.main_product || "N/A"}
              </span>
              <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                Rota {call.rota || call.route || "-"}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <ChevronRight className="text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
};
