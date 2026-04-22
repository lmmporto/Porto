# tsconfig.json

## Visão geral
- Caminho original: `api-server/tsconfig.json`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **typescript-config**
- Criticidade: **important**
- Score de importância: **118**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **18**
- Imports detectados: **0**
- Exports detectados: **0**
- Funções/classes detectadas: **0**

## Resumo factual
Este arquivo foi classificado como typescript-config no domínio backend. Criticidade: important. Prioridade: 01-FUNDAMENTAL.

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
_Nenhuma palavra-chave relevante detectada_

## Indícios de framework/arquitetura
_Nenhum indício específico detectado_

## Código
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    // "baseUrl": ".",  <-- REMOVA ESTA LINHA
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```
