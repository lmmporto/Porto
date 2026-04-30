"use client";

import { HelpChat } from '@/features/help-chat/components/HelpChat';

export default function HelpChatPage() {
  return (
    <main className="h-screen w-full flex flex-col bg-white dark:bg-zinc-950 font-sans">
      <HelpChat />
    </main>
  );
}
