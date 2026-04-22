# auth.ts

## Visão geral
- Caminho original: `api-server/src/utils/auth.ts`
- Domínio: **backend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **utility**
- Criticidade: **important**
- Score de importância: **88**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **34**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como utility no domínio backend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: checkIfAdmin. Funções/classes detectadas: checkIfAdmin. Dependências locais detectadas: ../firebase.js. Temas relevantes detectados: admin, auth, email, firebase. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `../firebase.js`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `../firebase.js`

## Exports detectados
- `checkIfAdmin`

## Funções e classes detectadas
- `checkIfAdmin`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `auth`
- `email`
- `firebase`

## Indícios de framework/arquitetura
- `firebase`

## Código
```ts
import { db } from "../firebase.js";

export async function checkIfAdmin(email: string): Promise<boolean> {
  try {
    if (!email) return false;

    const doc = await db.collection("configuracoes").doc("gerais").get();
    if (!doc.exists) return false;

    const data = doc.data();
    const adminsRaw = data?.admins;
    const normalizedUserEmail = email.toLowerCase().trim();

    // 🚩 TRATAMENTO MULTI-TIPO (O Segredo da Resiliência)

    // Caso 1: O banco tem uma LISTA de admins
    if (Array.isArray(adminsRaw)) {
      return adminsRaw.some(adminEmail =>
        typeof adminEmail === 'string' &&
        adminEmail.toLowerCase().trim() === normalizedUserEmail
      );
    }

    // Caso 2: O banco tem apenas UMA STRING (Seu estado atual)
    if (typeof adminsRaw === 'string') {
      return adminsRaw.toLowerCase().trim() === normalizedUserEmail;
    }

    return false;
  } catch (error) {
    console.error("❌ [AUTH ERROR] Erro ao verificar admin:", error);
    return false;
  }
}
```
