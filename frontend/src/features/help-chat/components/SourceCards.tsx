import { useState } from 'react';
import { Source } from '../types';
import { ChevronDown, ChevronUp, ExternalLink, FileText } from 'lucide-react';

export function SourceCards({ sources }: { sources: Source[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
        Fontes Consultadas
      </p>
      {sources.map((source) => (
        <div key={source.id} className="bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
          <div 
            onClick={() => setExpandedId(expandedId === source.id ? null : source.id)}
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-[400px]">
                {source.title}
              </h4>
            </div>
            {expandedId === source.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </div>
          
          {expandedId === source.id && (
            <div className="p-3 pt-0 border-t border-zinc-100 dark:border-zinc-700/50 text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
              <p className="mt-2 mb-3 leading-relaxed border-l-2 border-blue-400 pl-3 italic">
                "{source.content}..."
              </p>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
              >
                Ler artigo completo <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
