# use-mobile.tsx

## Visão geral
- Caminho original: `frontend/src/hooks/use-mobile.tsx`
- Domínio: **frontend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **hook**
- Criticidade: **important**
- Score de importância: **108**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **20**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **2**

## Resumo factual
Este arquivo foi classificado como hook no domínio frontend. Criticidade: important. Prioridade: 01-FUNDAMENTAL. Exports detectados: useIsMobile. Funções/classes detectadas: onChange, useIsMobile. Dependências externas detectadas: react. Indícios de framework/arquitetura: react/tsx.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `react`

## Todos os imports detectados
- `react`

## Exports detectados
- `useIsMobile`

## Funções e classes detectadas
- `onChange`
- `useIsMobile`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
- `react/tsx`

## Código
```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```
