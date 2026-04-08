"use client";

import { useDashboard } from '@/context/DashboardContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SDRDashboardPage() {
  const { user, isAdmin, isInitialized } = useDashboard();
  const router = useRouter();

  // 🚩 Trava de Segurança e Redirecionamento
  useEffect(() => {
    if (isInitialized && isAdmin) {
      // Se um admin tentar acessar /me, joga ele de volta para o dashboard principal
      router.replace('/dashboard');
    }
    if (isInitialized && !user) {
      // Se não estiver logado, vai para o login
      router.replace('/login');
    }
  }, [isInitialized, isAdmin, user, router]);

  // Evita mostrar a tela antes da checagem de autenticação
  if (!isInitialized || !user || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se passou por tudo, é um SDR logado.
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Painel Pessoal do SDR: {user.name}</h1>
      {/* Aqui vamos construir os novos componentes */}
    </div>
  );
}