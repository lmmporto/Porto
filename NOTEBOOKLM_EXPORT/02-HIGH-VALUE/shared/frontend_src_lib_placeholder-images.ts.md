# placeholder-images.ts

## Visão geral
- Caminho original: `frontend/src/lib/placeholder-images.ts`
- Domínio: **shared**
- Prioridade: **02-HIGH-VALUE**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **70**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **11**
- Imports detectados: **1**
- Exports detectados: **2**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 02-HIGH-VALUE. Exports detectados: ImagePlaceholder, PlaceHolderImages. Dependências locais detectadas: ./placeholder-images.json.

## Dependências locais
- `./placeholder-images.json`

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
- `./placeholder-images.json`

## Exports detectados
- `ImagePlaceholder`
- `PlaceHolderImages`

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```ts
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

```
