# page.tsx

## Visão geral
- Caminho original: `frontend/src/app/dashboard/team/page.tsx`
- Domínio: **frontend**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **page**
- Criticidade: **important**
- Score de importância: **90**
- Entry point: **sim**
- Arquivo central de fluxo: **sim**
- Linhas: **41**
- Imports detectados: **4**
- Exports detectados: **2**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como page no domínio frontend. Criticidade: important. Prioridade: 02-HIGH-VALUE. Exports detectados: TeamPage, function. Funções/classes detectadas: TeamPage. Dependências locais detectadas: @/lib/firebase. Dependências externas detectadas: firebase/firestore, next/link, react. Temas relevantes detectados: dashboard, firebase, sdr, team. Indícios de framework/arquitetura: react/tsx, next-app-router, client-component, firebase.

## Dependências locais
- `@/lib/firebase`

## Dependências externas
- `firebase/firestore`
- `next/link`
- `react`

## Todos os imports detectados
- `@/lib/firebase`
- `firebase/firestore`
- `next/link`
- `react`

## Exports detectados
- `TeamPage`
- `function`

## Funções e classes detectadas
- `TeamPage`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `dashboard`
- `firebase`
- `sdr`
- `team`

## Indícios de framework/arquitetura
- `react/tsx`
- `next-app-router`
- `client-component`
- `firebase`

## Código
```tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function TeamPage() {
  const [sdrs, setSdrs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sdrs"), (snapshot) => {
      setSdrs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="h1-elite">Equipe de Vendas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sdrs.map(sdr => (
          <Link key={sdr.id} href={`/dashboard/sdrs/${sdr.id}`}>
            <div className="glass-card p-6 rounded-xl tonal-layer cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {sdr.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-on-surface">{sdr.name}</p>
                  <p className="text-xs text-slate-500 uppercase">SDR Senior</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

```
