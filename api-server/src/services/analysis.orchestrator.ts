import { createHash } from 'node:crypto';
import { CONFIG } from '../config.js';
import { TempFileService } from '../infrastructure/storage/temp-file.service.js';
import { GeminiService } from '../infrastructure/ai/gemini.service.js';
import { AnalysisRepository } from '../infrastructure/database/analysis.repository.js';
import {
  CURRENT_ANALYSIS_VERSION,
  type AnalysisWithDebug,
  type OwnerDetails,
} from '../domain/analysis/analysis.types.js';
import {
  isAnalysisResult,
  isTranscriptionResult,
  isTeamStrategyResult,
  normalizeAnalysisResult,
} from '../domain/analysis/analysis.schemas.js';
import { PromptFactory } from '../domain/analysis/analysis.prompts.js';
import { safeJsonParse, sanitizeText } from '../utils.js';
import type { CallData } from './hubspot.js';

/**
 * 🏛️ ORQUESTRADOR: Coordena as camadas de Infraestrutura e Domínio.
 * Centraliza o fluxo lógico sem se preocupar com detalhes de implementação técnica.
 */
export class AnalysisOrchestrator {
  /**
   * Coordena o download, upload e transcrição de uma gravação.
   */
  static async transcribeRecording(call: CallData): Promise<string> {
    if (call.hasTranscript && call.transcript && call.transcript.length >= 100) {
      return call.transcript;
    }

    if (!call.recordingUrl) {
      throw new Error(`Nenhum áudio disponível para: ${call.callId || call.id}`);
    }

    let localFilePath = '';
    let uploadedFileName = '';

    try {
      // 1. Download do áudio via Infraestrutura de Storage
      const { localFilePath: downloadedPath, contentType } = await TempFileService.downloadAudio(
        call.recordingUrl!,
        CONFIG.HUBSPOT_TOKEN!,
        (call.callId || call.id)!
      );
      localFilePath = downloadedPath;

      // 2. Upload para IA e Polling de Processamento
      const uploadedFile = await GeminiService.uploadAndPoll(
        localFilePath,
        contentType,
        call.id
      );
      uploadedFileName = uploadedFile.name;

      // 3. Geração de Transcrição via Infraestrutura de IA
      const rawResponse = await GeminiService.generateTranscription(
        uploadedFile.uri,
        uploadedFile.mimeType,
        call.id
      );

      const parsed = safeJsonParse(rawResponse);
      if (!isTranscriptionResult(parsed)) {
        throw new Error('INVALID_TRANSCRIPTION_RESPONSE: A resposta da IA não contém um transcript válido.');
      }

      return sanitizeText(parsed.transcript);
    } finally {
      // Limpeza rigorosa de recursos (local e remoto)
      if (uploadedFileName) {
        await GeminiService.deleteFileSafely(uploadedFileName);
      }
      await TempFileService.cleanup(localFilePath);
    }
  }

  /**
   * Coordena a análise estratégica da transcrição.
   */
  static async analyzeCall(
    call: CallData,
    ownerDetails: OwnerDetails
  ): Promise<AnalysisWithDebug & { transcriptHash: string }> {
    if (!call.transcript || call.transcript.trim().length < 10) {
      throw new Error('Transcrição insuficiente ou ausente para análise.');
    }

    const transcriptHash = createHash('sha256')
      .update(call.transcript)
      .digest('hex');

    // 1. Validação de Cache (Regra de Domínio via Orquestrador)
    if (
      call.lastAnalysisVersion === CURRENT_ANALYSIS_VERSION &&
      call.lastTranscriptHash === transcriptHash &&
      isAnalysisResult(call.analysisResult)
    ) {
      console.log(`✅ [CACHE] Reutilizando análise: ${CURRENT_ANALYSIS_VERSION}`);
      return {
        analysis: normalizeAnalysisResult(call.analysisResult),
        rawPrompt: 'Cache',
        rawResponse: 'Cache',
        transcriptHash,
      };
    }

    console.log(`🧠 [IA] Iniciando análise estratégica (Mestre Mentor) para: ${call.id}`);

    const prompt = PromptFactory.getAnalysisPrompt(ownerDetails.ownerName, call.transcript);

    const rawResponse = await GeminiService.generateAnalysis(prompt, call.id);
    const parsed = safeJsonParse(rawResponse);

    if (!isAnalysisResult(parsed)) {
      throw new Error('Falha na validação da estrutura de resposta da IA.');
    }

    return {
      analysis: normalizeAnalysisResult(parsed),
      rawPrompt: prompt,
      rawResponse,
      transcriptHash,
    };
  }

  /**
   * Coordena a geração da análise estratégica consolidada da equipe.
   * Lê o resumo global, constrói o prompt e persiste o resultado via Repositório.
   */
  static async generateTeamStrategy(): Promise<void> {
    try {
      console.log('[STRATEGY] Iniciando geração de leitura consolidada...');

      const summary = await AnalysisRepository.getGlobalSummary();

      if (!summary) {
        console.log('[STRATEGY] Documento de resumo não encontrado. Abortando.');
        return;
      }

      const { recurrent_gaps, top_strengths, total_calls } = summary;

      if (!recurrent_gaps || !top_strengths || (total_calls ?? 0) < 5) {
        console.log('[STRATEGY] Dados insuficientes para análise. Abortando.');
        return;
      }

      const prompt = PromptFactory.getTeamStrategyPrompt(recurrent_gaps, top_strengths);

      const rawResponse = await GeminiService.generateStrategy(prompt, 'GLOBAL_STRATEGY');
      const parsed = safeJsonParse(rawResponse);

      if (!isTeamStrategyResult(parsed)) {
        throw new Error('Resposta da IA inválida ou incompleta.');
      }

      await AnalysisRepository.updateStrategyPersist('completed', parsed);
      console.log('[STRATEGY] Leitura consolidada atualizada com sucesso.');
    } catch (error) {
      console.error('[STRATEGY] Erro ao gerar leitura consolidada:', error);
      await AnalysisRepository.updateStrategyPersist('failed');
    }
  }
}
