import { Message } from '../types';
import { SourceCards } from './SourceCards';
import { FeedbackButtons } from './FeedbackButtons';
import { Bot, User } from 'lucide-react';

export function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'} mb-6 group`}>
      <div className={`flex max-w-[95%] sm:max-w-[85%] gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isAssistant ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
        }`}>
          {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        {/* Content Bubble */}
        <div className="flex flex-col gap-1 w-full">
          <div className={`flex items-center gap-2 px-1 ${!isAssistant && 'justify-end'}`}>
            <span className="text-xs font-medium text-zinc-500">
              {isAssistant ? 'Assistente Inteligente' : 'Você'}
            </span>
            <span className="text-[10px] text-zinc-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isAssistant 
              ? 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 rounded-tl-none' 
              : 'bg-blue-600 text-white rounded-tr-none'
          }`}>
            <div className="whitespace-pre-wrap font-sans">{message.content}</div>
            
            {/* Fontes (Apenas Assistente) */}
            {isAssistant && message.sources && message.sources.length > 0 && (
              <SourceCards sources={message.sources} />
            )}

            {/* Feedback (Apenas Assistente, e apenas se tiver queryId) */}
            {isAssistant && message.queryId && (
              <FeedbackButtons queryId={message.queryId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
