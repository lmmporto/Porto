# next.config.ts

## Visão geral
- Caminho original: `frontend/next.config.ts`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **36**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Exports detectados: nextConfig. Dependências externas detectadas: next.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `next`

## Todos os imports detectados
- `next`

## Exports detectados
- `nextConfig`

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
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

```
