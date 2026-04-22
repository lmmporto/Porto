# utils.ts

## Visão geral
- Caminho original: `frontend/src/lib/utils.ts`
- Domínio: **shared**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **70**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **20**
- Imports detectados: **2**
- Exports detectados: **3**
- Funções/classes detectadas: **3**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 02-HIGH-VALUE. Exports detectados: cn, formatEmailToSdrId, getInitials. Funções/classes detectadas: cn, formatEmailToSdrId, getInitials. Dependências externas detectadas: clsx, tailwind-merge. Temas relevantes detectados: email, sdr.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `clsx`
- `tailwind-merge`

## Todos os imports detectados
- `clsx`
- `tailwind-merge`

## Exports detectados
- `cn`
- `formatEmailToSdrId`
- `getInitials`

## Funções e classes detectadas
- `cn`
- `formatEmailToSdrId`
- `getInitials`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `email`
- `sdr`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Transforma um e-mail no formato de ID do Firestore (underscores)
 * Ex: amaranta.vieira@nibo.com.br -> amaranta_vieira@nibo_com_br
 */
export const formatEmailToSdrId = (email: string) => email.toLowerCase().trim().replace(/\./g, '_');

```
