import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Validação da URL base
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.error("❌ Erro: NEXT_PUBLIC_API_BASE_URL não definida.");
    return NextResponse.json({ error: 'Configuração de API ausente no Frontend' }, { status: 500 });
  }

  // 2. Preparação da URL e Parâmetros
  const { searchParams } = new URL(request.url);
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  // No seu backend Express, a rota correta está sob o prefixo /api
  const url = `${cleanBaseUrl}/api/calls?${searchParams.toString()}`;

  try {
    console.log(`📡 [PROXY] Solicitando dados ao Render: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.WEBHOOK_SECRET || '' 
      },
      next: { revalidate: 0 } // Garante que o Next.js não use cache antigo
    });

    // 3. Captura da resposta bruta para diagnóstico
    const responseText = await res.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      data = { rawResponse: responseText };
    }

    // 4. Tratamento de Erro vindo do Backend (Render)
    if (!res.ok) {
      console.error(`🚨 [BACKEND ERROR] Status ${res.status}:`, data);
      // Repassamos o status e o erro real para o seu console F12
      return NextResponse.json(
        { 
          error: 'O Backend Render retornou um erro', 
          status: res.status,
          details: data 
        }, 
        { status: res.status }
      );
    }

    // 5. Sucesso: Retorno dos dados (Lista de Chamadas)
    console.log(`✅ [PROXY] Dados recebidos com sucesso de ${url}`);
    return NextResponse.json(data);

  } catch (err: any) {
    // 6. Falha de Conexão (Render Offline ou Timeout)
    console.error(`❌ [NETWORK ERROR] Falha ao conectar no Render:`, err.message);
    return NextResponse.json(
      { 
        error: 'Não foi possível conectar ao servidor Render', 
        details: err.message 
      }, 
      { status: 504 }
    );
  }
}