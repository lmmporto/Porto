# INSTRUCTIONS.MD

## Visão geral
- Caminho original: `api-server/INSTRUCTIONS.MD`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **documentation**
- Criticidade: **important**
- Score de importância: **118**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **67**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como documentation no domínio backend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Temas relevantes detectados: admin, analysis, auth, calls, dashboard, firebase, hubspot, sdr, token, webhook. Indícios de framework/arquitetura: express, firebase.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `analysis`
- `auth`
- `calls`
- `dashboard`
- `firebase`
- `hubspot`
- `sdr`
- `token`
- `webhook`

## Indícios de framework/arquitetura
- `express`
- `firebase`

## Código
```md
# 📜 MANUAL DO PROJETO: MONITORAMENTO SDR (FRONT & BACK)

## 1. VISÃO GERAL DA ARQUITETURA
O projeto é um ecossistema dividido em duas frentes que se comunicam via API. 
* **FRONTEND (Next.js / Vercel):** Interface do Dashboard. Responsável por exibir dados e filtrar visualizações. Não deve acessar o Firebase Admin nem processar áudios.
* **BACKEND (Node.js Express / Render):** O "músculo". Processa Webhooks do HubSpot, Transcrição (Whisper/Gemini), Análise de IA e gravação no Firebase.

---

## 2. MAPA DE DIRETÓRIOS (PARA A IA NÃO SE PERDER)

### 📂 Backend (Hospedado no Render)
* `src/api-server/index.ts`: Ponto de entrada (Configuração Express e CORS).
* `src/api-server/firebase.ts`: Conexão com SDK Admin. (Lê a variável `_JSON`).
* `src/api-server/calls.ts`: Rotas de API (`GET /calls`, `POST /hubspot-webhook`).
* `src/api-server/services/processCall.ts`: **Lógica Central.** Filtros de descarte e fluxo de análise.
* `src/api-server/services/analysis.service.ts`: Integração com Gemini/OpenAI.

### 📂 Frontend (Hospedado na Vercel)
* `src/app/page.tsx`: Dashboard Principal (Gráficos e Tabela).
* `src/app/api/calls/route.ts`: **Proxy de Segurança.** O Front chama essa rota, que repassa o pedido para o Render.
* `src/lib/firebase.ts`: Configuração do Firebase Client (apenas para Auth, se necessário).

---

## 3. TABELA DA VERDADE: VARIÁVEIS DE AMBIENTE

| Serviço  | Nome da Variável                | Valor Esperado                                   |
| :------- | :------------------------------ | :----------------------------------------------- |
| BACKEND  | `FIREBASE_SERVICE_ACCOUNT_JSON` | Conteúdo completo do JSON da Service Account     |
| BACKEND  | `HUBSPOT_TOKEN`                 | Bearer Token de acesso à API do HubSpot          |
| BACKEND  | `WEBHOOK_SECRET`                | Segredo para validar o Header `x-webhook-secret` |
| FRONTEND | `NEXT_PUBLIC_API_BASE_URL`      | URL do Render (ex: https://porto-58em.onrender.com) |

---

## 4. REGRAS DE OURO (LÓGICA DE NEGÓCIO)

### 🚨 Filtro de Descarte (Tempo Mínimo)
* **Regra:** Toda ligação com menos de **60 segundos (1 minuto)** deve ser descartada da análise profunda.
* **Ação:** Salvar no banco com `processingStatus: "SKIPPED_SHORT_CALL"` e `nota_spin: 0`. Isso protege a média de performance dos SDRs.

### 📞 Filtro de Equipes (SDRs)
* **Permitidos:** `["Time William", "Equipe Alex", "Time Lucas", "Time Amanda", "SDR", "Pré-Venda"]`.
* **Bloqueados:** `["CX", "Suporte", "Customer Success", "Financeiro"]`.
* **Exceção:** Se o nome do time contiver "SDR" (ex: "SDR Suporte"), a ligação **deve** ser processada.

### 🔄 Fluxo de Processamento
1.  **Webhook:** Recebe o ID e responde `200 OK` em menos de 2 segundos.
2.  **Retry de Áudio:** Se o áudio não estiver disponível no HubSpot na hora, aguarda 15s e tenta novamente (até 2 vezes).
3.  **Análise:** Se tiver +1min e áudio, envia para Transcrição e Gemini (Metodologia SPIN).

---

## 5. PROTOCOLOS DE SEGURANÇA E ERROS

1.  **CORS:** O Backend no Render deve permitir apenas o `FRONTEND_URL` (Vercel).
2.  **Blindagem do Firebase:** O arquivo `firebase.ts` deve validar o `JSON.parse` das chaves. Se falhar, deve travar o servidor com um log explícito.
3.  **Proxy de API:** O Frontend nunca deve tentar acessar o Render diretamente via browser. Deve sempre usar o `route.ts` interno como ponte.

---

## 6. ANTI-PADRÕES (O QUE NÃO FAZER)
* **NÃO** usar `any` em tipos de IDs ou Notas.
* **NÃO** silenciar erros. Se a IA falhar, o status deve ser `FAILED_ANALYSIS` no banco com o erro detalhado.
* **NÃO** mudar nomes de pastas sem atualizar este manual.

```
