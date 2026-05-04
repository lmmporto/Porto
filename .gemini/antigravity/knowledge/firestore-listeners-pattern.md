# Padrão: Gerenciamento de Listeners Firestore

## Regra fundamental
Todo `onSnapshot` aninhado dentro de outro `onSnapshot` DEVE ter seu
unsubscribe capturado e chamado antes de criar um novo listener.

## Padrão obrigatório para listeners aninhados

```ts
function createTeamBasedSubscription() {
  let internalUnsubscribers: (() => void)[] = [];

  const cancelInternals = () => {
    internalUnsubscribers.forEach(u => u());
    internalUnsubscribers = [];
  };

  const unsubscribeExternal = onSnapshot(externalQuery, (externalSnapshot) => {
    // 1. CANCELAR listeners internos anteriores antes de abrir novos
    cancelInternals();

    externalSnapshot.docs.forEach(doc => {
      // 2. Abrir novo listener e guardar o unsubscribe
      const unsub = onSnapshot(internalQuery, () => {
        // lógica
      });
      internalUnsubscribers.push(unsub);
    });
  });

  // 3. Retornar cleanup que limpa TUDO
  return () => {
    cancelInternals();
    unsubscribeExternal();
  };
}
```

## Padrão obrigatório em useEffect

```ts
useEffect(() => {
  if (!id) return;
  
  // Guardar unsubscribe em uma variável
  const unsubscribe = onSnapshot(query(...), (snapshot) => {
    // lógica de processamento
  });
  
  // RETORNAR a função de cleanup do React
  return () => unsubscribe(); 
}, [id]); // Usar identificador estável (primitivo), nunca objeto inteiro
```

## Regras de dependência do useEffect
- **NUNCA** usar objeto inteiro como dependência (ex: `sdrData`). Objetos mudam de referência a cada render.
- **SEMPRE** usar o identificador estável (ex: `sdrData?.email`, `sdrData?.id`).
- Arrays e objetos criados inline no corpo do componente devem ser memoizados com `useMemo`.

## Impacto de ignorar esse padrão
Cada render com objeto instável como dependência cria um novo listener sem cancelar o anterior. Com centenas de documentos e múltiplos SDRs em tempo real, isso gera um "spike" exponencial de leituras. 
- **Incidente de 30/04/2026**: 48.000 leituras em um único dia causado por listeners órfãos.

## Arquivos de referência
- `frontend/src/features/dashboard/api/dashboard.service.ts`
- `frontend/src/features/dashboard/components/SdrProfilePanel.tsx`
- `frontend/src/app/dashboard/page.tsx`
