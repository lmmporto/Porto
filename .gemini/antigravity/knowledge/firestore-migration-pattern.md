# Padrão: Migração de Dados no Firestore

## Contexto
O projeto utiliza **Firestore (NoSQL)**. Não há um sistema de migrations transacionais como em bancos SQL. O padrão estabelecido é a execução de **scripts ad-hoc** de normalização combinados com **schemas defensivos** no frontend.

## Padrão de script de migração (Batch Migration)

Sempre utilize o `db.batch()` para garantir atomicidade em grupos de documentos e respeite os limites do Firestore.

```ts
// Localização recomendada: api-server/scripts/
// Execução: npx ts-node api-server/scripts/nome-do-script.ts

import * as admin from 'firebase-admin';
const db = admin.firestore();

const BATCH_SIZE = 400; // Limite seguro abaixo do máximo de 500 do Firestore

async function migrate() {
  console.log("Iniciando migração...");
  const snapshot = await db.collection('analyses').get();
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const slice = docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    
    let countInBatch = 0;

    for (const doc of slice) {
      const data = doc.data();
      const update: any = {};
      
      // Lógica de transformação (Exemplo: normalizar campo antigo)
      if (typeof data.campo_antigo === 'string') {
        update.campo_novo = [data.campo_antigo];
      }

      if (Object.keys(update).length > 0) {
        batch.update(doc.ref, update);
        countInBatch++;
      }
    }

    if (countInBatch > 0) {
      await batch.commit();
      console.log(`Lote de ${countInBatch} documentos processado.`);
    }
  }
}
```

## Protocolo de Segurança: DRY RUN
Sempre implemente e execute um modo "Dry Run" antes de aplicar as mudanças reais em produção.

```bash
# Exemplo de uso
DRY_RUN=true npx ts-node api-server/scripts/migrate-insights-format.ts
```

## Estratégia de Coexistência (Blue/Green Data)
1. **Zod Defaults**: Novos campos devem ser definidos com `.optional().default(val)` para não quebrar o parse de documentos antigos.
2. **UI Guards**: No frontend, utilize o operador de coalescência nula `??` para exibir fallbacks visuais.
3. **Scripts de Normalização**: Devem ser executados para "trazer" dados antigos para o formato novo sem deletar informações originais.

## Custos e Cotas
`db.collection().get()` realiza uma leitura por documento. Em coleções grandes, isso pode esgotar a cota diária do plano gratuito (50k leituras). 
- **Regra**: Rodar migrações preferencialmente fora do horário de pico do dashboard.

## Scripts de Referência
- `api-server/scripts/migrate-insights-format.ts`: Normaliza `insights_estrategicos` e injeta `score_proximo_passo`.
- `api-server/scripts/migrate-registry-ids.js`: Ajusta identificadores de SDRs no registro central.
