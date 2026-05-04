# Padrão: Exportação de Funções no DashboardContext

## Regra de Arquitetura
Toda função que precise ser acessada por mais de um componente (ex: re-verificação de usuário no Sidebar e no Login) **DEVE** estar definida no escopo principal do `DashboardProvider` e ser exportada explicitamente via `DashboardContextType`.

## Padrão de Implementação (Memorização)

Para evitar re-renderizações desnecessárias em componentes que consomem o contexto, todas as funções exportadas devem ser envolvidas em `useCallback`.

```ts
// 1. Definir com useCallback no escopo do Provider
const checkUser = useCallback(async () => {
  setLoadingAuth(true);
  try {
    // lógica de fetch e atualização de estado
  } finally {
    setLoadingAuth(false);
  }
}, []); // Dependências vazias se a função for estável

// 2. Adicionar obrigatoriamente à Interface
interface DashboardContextType {
  user: User | null;
  checkUser: () => Promise<void>; // Assinatura clara
}

// 3. Expor no Provider Value
return (
  <DashboardContext.Provider value={{ user, checkUser }}>
    {children}
  </DashboardContext.Provider>
);
```

## Anti-padrões (Evitar)
- **Funções em useEffect**: Nunca defina funções que precisam ser exportadas dentro de um `useEffect`. Elas ficam presas ao escopo local do efeito e o TypeScript impedirá sua exposição no Provider.
- **Funções sem useCallback**: Exportar funções "nuas" causa mudança de referência do objeto `value` a cada render, disparando re-renders em cascata em toda a árvore de componentes.

## Funções Atualmente Exportadas
- `checkUser`: Sincroniza o estado do usuário com o backend via `/auth/me`.
- `setViewingEmail`: Ativa o modo de visualização (impersonate) para administradores.
- `toggleSidebar`: Gerencia o estado visual da navegação.
- `setCurrentTeam`: Altera o filtro de time ativo no dashboard global.

## Arquivo de Referência
- `frontend/src/context/DashboardContext.tsx`

## Regra de Redirect — Anti-padrão crítico

Nunca adicione redirects baseados em email ou identidade do usuário dentro 
de componentes de página ou painéis. Todo redirect de autenticação e 
autorização deve viver exclusivamente no `DashboardContext.tsx`.

Componentes com redirect hardcoded por email criam loops quando interagem 
com as regras do Context — como ocorreu no incidente de 30/04/2026 com o 
`SdrProfilePanel`.

Regra de ouro: se você está escrevendo `router.push` dentro de um componente 
que não é o Context, questione se esse redirect deveria estar lá.
