import { useEffect, useRef } from 'react';
import { useHelpChat } from '../hooks/useHelpChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { BookOpen } from 'lucide-react';

export function HelpChat() {
  const { messages, isLoading, error, sendMessage } = useHelpChat();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto scroll para a última mensagem
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/50 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
              Central de Ajuda Inteligente
            </h1>
            <p className="text-xs text-zinc-500">Respostas instantâneas baseadas nos manuais oficiais</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50 flex items-center justify-center font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isLoading && (
              <div className="flex w-full justify-start mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                  <div className="px-5 py-3.5 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 z-10">
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
      </div>

    </div>
  );
}
