import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export function FeedbackButtons({ queryId }: { queryId: string }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const handleVote = async (type: 'up' | 'down') => {
    if (vote) return; // Só permite votar uma vez no UI
    
    setVote(type);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/api/help-chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          queryId, 
          rating: type === 'up' ? 1 : -1 
        })
      });
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
      <span className="text-xs text-zinc-500">Esta resposta foi útil?</span>
      <button 
        onClick={() => handleVote('up')}
        disabled={vote !== null}
        className={`p-1.5 rounded-md transition-colors ${
          vote === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 disabled:opacity-50'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button 
        onClick={() => handleVote('down')}
        disabled={vote !== null}
        className={`p-1.5 rounded-md transition-colors ${
          vote === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 disabled:opacity-50'
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}
