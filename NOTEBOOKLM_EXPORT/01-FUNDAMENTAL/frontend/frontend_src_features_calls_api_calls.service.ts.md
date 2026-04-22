# calls.service.ts

## Visão geral
- Caminho original: `frontend/src/features/calls/api/calls.service.ts`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **feature-api**
- Criticidade: **important**
- Score de importância: **124**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **39**
- Imports detectados: **2**
- Exports detectados: **1**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como feature-api no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: subscribeToCalls. Funções/classes detectadas: subscribeToCalls. Dependências locais detectadas: @/lib/firebase. Dependências externas detectadas: firebase/firestore. Temas relevantes detectados: analysis, calls, email, firebase, sdr. Indícios de framework/arquitetura: firebase.

## Dependências locais
- `@/lib/firebase`

## Dependências externas
- `firebase/firestore`

## Todos os imports detectados
- `@/lib/firebase`
- `firebase/firestore`

## Exports detectados
- `subscribeToCalls`

## Funções e classes detectadas
- `subscribeToCalls`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `analysis`
- `calls`
- `email`
- `firebase`
- `sdr`

## Indícios de framework/arquitetura
- `firebase`

## Código
```ts
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, where } from "firebase/firestore";

const ELITE_SDRS = [
  'amaranta.vieira@nibo.com.br',
  'andriel.mateus@nibo.com.br',
  'bruno.rezende@nibo.com.br',
  'elder.fernando@nibo.com.br',
  'italo.xavier@nibo.com.br',
  'mateus.braga@nibo.com.br'
];

export const subscribeToCalls = (callback: (calls: any[]) => void) => {
  if (!db) return () => {};

  const q = query(
    collection(db, "calls_analysis"),
    where('ownerEmail', 'in', ELITE_SDRS),
    orderBy("callTimestamp", "desc"),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        score: data.nota_spin || 0,
        sdrName: data.ownerName || "SDR Nibo",
        clientName: data.clientName || "Lead Nibo",
        main_product: data.produto_principal || "N/A",
        route: data.rota || "-",
        date: data.callTimestamp?.toDate ? data.callTimestamp.toDate() : new Date(),
      };
    });
    callback(calls);
  });
};

```
