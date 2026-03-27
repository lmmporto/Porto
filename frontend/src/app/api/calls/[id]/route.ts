import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Tipagem correta para Next.js 15
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    if (!baseUrl) {
      console.error("🚨 Erro: NEXT_PUBLIC_API_BASE_URL não definida na Vercel.");
      return NextResponse.json({ debug: "Erro: Variável de ambiente ausente" }, { status: 500 });
    }

    // 🚩 Suporte ao Next.js 15: params deve ser aguardado
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ debug: "Erro: ID da chamada não informado" }, { status: 400 });
    }

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    // 🚩 BUSCA DIRETA: Pedimos apenas o ID específico ao backend no Render
    const targetUrl = `${cleanBaseUrl}/api/calls/${id}`;

    console.log(`📡 Proxy Call: Buscando detalhe único do ID ${id} no Render...`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.WEBHOOK_SECRET || ''
      },
      cache: 'no-store' // Garante dados sempre frescos
    });

    // Tratamento de Resposta Não-OK
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ debug: "Chamada não encontrada no banco de dados" }, { status: 404 });
      }
      const errorData = await response.text();
      return NextResponse.json({ debug: "O servidor backend falhou", detalhes: errorData }, { status: response.status });
    }

    const data = await response.json();

    // 🚩 TRATAMENTO DE COTA (Firebase RESOURCE_EXHAUSTED)
    if (data && data.error && data.error.includes('RESOURCE_EXHAUSTED')) {
      console.error("🚨 Cota de leitura do Firebase atingida!");
      return NextResponse.json({ error: "Limite de consultas atingido. Tente novamente mais tarde." }, { status: 429 });
    }

    // Retorna a chamada encontrada (suportando diferentes formatos de retorno do backend)
    const callData = data.call || data;

    console.log(`✅ Detalhe da call ${id} entregue.`);
    return NextResponse.json(callData);

  } catch (error: any) {
    console.error("❌ Erro fatal no Proxy de Detalhe:", error.message);
    return NextResponse.json({ 
      debug: "Erro interno no Proxy da API",
      mensagem: error.message 
    }, { status: 500 });
  }
}