export interface Source {
  id: string;
  title: string;
  url: string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  queryId?: string; // Presente na resposta do assistente para permitir feedback
  timestamp: Date;
}
