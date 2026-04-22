# postcss.config.mjs

## Visão geral
- Caminho original: `frontend/postcss.config.mjs`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **9**
- Imports detectados: **1**
- Exports detectados: **1**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Exports detectados: config. Dependências externas detectadas: postcss-load-config.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `postcss-load-config`

## Todos os imports detectados
- `postcss-load-config`

## Exports detectados
- `config`

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
```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;

```
