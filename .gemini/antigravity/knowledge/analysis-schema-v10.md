# Schema de Análise V10 — Mestre Mentor

## Versão atual
`V10_MESTRE_MENTOR` — implementada em 30/04/2026

## Scores (total máximo: 10 pontos)
| Campo | Peso | Range | Descrição |
|-------|------|-------|-----------|
| `score_dominio` | 4.0 | 0–4 | Controle e direcionamento da call |
| `score_dor` | 4.0 | 0–4 | Exploração e aprofundamento da dor |
| `score_proximo_passo` | 2.0 | 0–2 | Clareza e compromisso do próximo passo |

**Regra de validação**: `score_dominio + score_dor + score_proximo_passo <= 10`

## Status final
Valores permitidos (Enum): `EXCELENTE | BOM | ATENCAO | CRITICO`
**Nunca usar**: `APROVADO` ou `REPROVADO` (valores obsoletos removidos na V10).

## Campo maior_dificuldade
Apenas estes enums são permitidos (Case Sensitive) — nunca frases livres ou strings genéricas:
- `EXPLORACAO_DOR`
- `CONTROLE_CONVERSA`
- `PROXIMO_PASSO`
- `RAPPORT`
- `OBJECOES`
- `QUALIFICACAO`
- `FIT_PRODUTO`

## Campo insights_estrategicos
Formato obrigatório — array de objetos com tipagem forte, nunca string ou array de strings:
```ts
{
  label: string;  // Nome curto do indicador (ex: "Rapport Inicial")
  value: string;  // Descrição detalhada do achado em uma frase
  type: 'positive' | 'negative' | 'neutral'; // Impacto visual
}
```

## Campos novos adicionados na V10
- `score_proximo_passo` (numérico 0-2)
- `status_final` (novo enum de performance)
- `alertas` (array de strings)
- `ponto_atencao` (texto livre)
- `pontos_fortes` (array de strings)
- `perguntas_sugeridas` (array de strings)
- `analise_escuta` (texto livre de feedback técnico)
- `nome_do_lead` (extraído da transcrição)
- `mensagem_final_sdr` (feedback direto para o SDR)

## Compatibilidade histórica e Resiliência
- **Frontend**: Usa guards defensivos `(campo ?? 0)` ou `(campo || '-')` para tratar registros V1-V9.
- **Insights Antigos**: Se `insights_estrategicos` for string em registros antigos, o parser Zod retorna um array vazio por segurança.
- **Score Ausente**: Se `score_proximo_passo` for nulo (registros legados), a UI exibe `—`.

## Arquivos de referência
- `api-server/src/domain/analysis/analysis.types.ts`
- `api-server/src/domain/analysis/analysis.schemas.ts`
- `api-server/src/domain/analysis/analysis.prompts.ts`
- `frontend/src/types/index.ts`
