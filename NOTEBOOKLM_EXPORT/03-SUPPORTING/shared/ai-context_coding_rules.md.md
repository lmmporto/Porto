# coding_rules.md

## Visão geral
- Caminho original: `ai-context/coding_rules.md`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **56**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Temas relevantes detectados: token.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
_Nenhuma dependência externa detectada_

## Todos os imports detectados
_Nenhum import detectado_

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
_Nenhuma função/classe detectada_

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `token`

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```md
# Regras de implementação para IA

## Fonte de verdade

Sempre utilizar código dentro de:

src/

Nunca utilizar:

dist/

dist é apenas build.

## Alterações de código

A IA deve:

- alterar apenas arquivos relevantes
- não refatorar arquivos fora do escopo
- não criar arquivos desnecessários
- evitar duplicação de lógica

## Processo obrigatório

Antes de implementar código:

1. explicar o plano
2. mostrar estrutura de arquivos
3. implementar apenas após aprovação

## Integrações externas

Integrações devem ficar apenas em:

integrations/

## Lógica de negócio

Deve ficar apenas em:

services/

## Rotas

Rotas não devem conter lógica de negócio.

Devem apenas chamar controllers.

## Segurança

Nunca expor:

- tokens
- chaves
- secrets
```
