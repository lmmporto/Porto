import { CallProcessingOrchestrator } from '../src/services/call-processing.orchestrator.ts';

async function runTests() {
    console.log("🚀 Iniciando Testes de Validação...");

    // Teste 1: Processamento Real
    const testId = "108120936801";
    const result = await CallProcessingOrchestrator.processCall(testId, "test_worker");
    console.log("Resultado Processamento:", result);

    // Teste 2: Verificar se os metadados existem no Firestore manualmente após o Teste 1
}

runTests().catch(console.error);