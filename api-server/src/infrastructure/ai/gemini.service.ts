// src/infrastructure/ai/gemini.service.ts
import { createPartFromUri, createUserContent } from '@google/genai';
import { gemini } from '../../clients.js';
import { CONFIG } from '../../config.js';
import {
  ANALYSIS_RESPONSE_SCHEMA,
  TRANSCRIPTION_RESPONSE_SCHEMA,
  TEAM_STRATEGY_RESPONSE_SCHEMA,
} from '../../domain/analysis/analysis.schemas.js';

/**
 * 🏛️ ARQUITETO: Serviço de Infraestrutura para Integração com Google Gemini
 */
export class GeminiService {
  /**
   * Obtém o cliente Gemini validado.
   */
  private static getModel() {
    if (!gemini) {
      throw new Error('GEMINI_API_KEY não configurada.');
    }
    return gemini;
  }

  /**
   * Limpa a resposta da IA de blocos de código Markdown.
   */
  static cleanResponse(text: string): string {
    if (!text) return '';
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  /**
   * 📤 Faz upload do arquivo para o Gemini e aguarda o processamento (polling).
   * @returns O objeto do arquivo processado no Google.
   */
  static async uploadAndPoll(
    filePath: string,
    mimeType: string,
    callId: string
  ): Promise<{ name: string; uri: string; mimeType: string }> {
    console.log(`📤 [GEMINI] Iniciando upload: ${callId}`);

    const uploadedFile = await this.getModel().files.upload({
      file: filePath,
      config: { mimeType },
    });

    if (!uploadedFile?.uri || !uploadedFile?.mimeType || !uploadedFile?.name) {
      throw new Error('Falha no upload do arquivo para o Gemini.');
    }

    // 🚩 ESPERA ATIVA (POLLING): O Segredo da Estabilidade
    let fileStatus = await this.getModel().files.get({
      name: uploadedFile.name,
    });
    let attempts = 0;

    // Aguarda até que o arquivo esteja 'ACTIVE' ou exceda 15 tentativas
    while (fileStatus.state === 'PROCESSING' && attempts < 15) {
      console.log(
        `⏳ [GEMINI] Arquivo ${callId} em processamento... aguardando 2s (Tentativa ${
          attempts + 1
        })`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      fileStatus = await this.getModel().files.get({ name: uploadedFile.name });
      attempts++;
    }

    if (fileStatus.state !== 'ACTIVE') {
      throw new Error(
        `Arquivo ${callId} não ficou pronto a tempo. Estado: ${fileStatus.state}`
      );
    }

    console.log(`✅ [GEMINI] Arquivo ${callId} pronto para uso.`);
    return {
      name: uploadedFile.name,
      uri: uploadedFile.uri,
      mimeType: uploadedFile.mimeType,
    };
  }

  /**
   * 🧹 Remove o arquivo do Gemini de forma segura.
   */
  static async deleteFileSafely(name: string): Promise<void> {
    if (!name) return;
    try {
      await this.getModel().files.delete({ name });
      console.log(`🧹 [GEMINI] Arquivo removido do Google: ${name}`);
    } catch (error) {
      // Falha silenciosa para limpeza
    }
  }

  /**
   * 📝 Gera transcrição integral a partir de um arquivo processado.
   */
  static async generateTranscription(
    fileUri: string,
    fileMimeType: string,
    callId: string
  ): Promise<string> {
    console.log(`📝 [GEMINI] Gerando transcrição: ${callId}`);

    const response = await this.getModel().models.generateContent({
      model: CONFIG.GEMINI_TRANSCRIPTION_MODEL,
      contents: createUserContent([
        createPartFromUri(fileUri, fileMimeType),
        'Transcreva integralmente este áudio de ligação em português do Brasil. Retorne apenas JSON válido.',
      ]),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: TRANSCRIPTION_RESPONSE_SCHEMA,
        temperature: 0,
      },
    });

    return this.cleanResponse(response?.text || '');
  }

  /**
   * 🧠 Gera análise técnica de vendas (SPIN/Taxonomia).
   */
  static async generateAnalysis(
    prompt: string,
    callId: string
  ): Promise<string> {
    console.log(`🧠 [GEMINI] Gerando análise: ${callId}`);

    const response = await this.getModel().models.generateContent({
      model: CONFIG.GEMINI_ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    return this.cleanResponse(response?.text || '');
  }

  /**
   * 📈 Gera análise estratégica consolidada para a equipe.
   */
  static async generateStrategy(
    prompt: string,
    callId: string
  ): Promise<string> {
    console.log(`📈 [GEMINI] Gerando análise estratégica: ${callId}`);

    const response = await this.getModel().models.generateContent({
      model: CONFIG.GEMINI_ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: TEAM_STRATEGY_RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });

    return this.cleanResponse(response?.text || '');
  }
}
