// src/infrastructure/storage/temp-file.service.ts
import axios from 'axios';
import { writeFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { detectAudioExtension } from '../../utils.js';

/**
 * 🏛️ ARQUITETO: Serviço de Infraestrutura para Gestão de Arquivos Temporários
 */
export class TempFileService {
  /**
   * 📥 Baixa o áudio da gravação e salva em um arquivo temporário no sistema.
   * @returns O caminho absoluto do arquivo salvo.
   */
  static async downloadAudio(
    url: string,
    token: string,
    callId: string
  ): Promise<{ localFilePath: string; contentType: string }> {
    let localFilePath = '';
    try {
      console.log(`📥 [INFRA] Iniciando download do áudio para call: ${callId}`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120_000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const buffer = Buffer.from(response.data as ArrayBuffer);
      const contentType = String(
        response.headers['content-type'] || 'audio/mpeg'
      );

      const fileName = `call-${randomUUID()}.${detectAudioExtension(
        contentType
      )}`;
      localFilePath = path.join(os.tmpdir(), fileName);

      await writeFile(localFilePath, buffer);

      console.log(
        `✅ [INFRA] Download concluído: ${localFilePath} (${buffer.byteLength} bytes)`
      );
      return { localFilePath, contentType };
    } catch (error: any) {
      console.error(
        `❌ [INFRA] Erro no download do áudio (${callId}):`,
        error.message
      );

      // Limpeza preventiva caso o arquivo tenha sido criado mas o processo falhou depois
      if (localFilePath) {
        await this.cleanup(localFilePath);
      }

      throw error;
    }
  }

  /**
   * 🧹 Remove o arquivo temporário do sistema de forma segura.
   */
  static async cleanup(localFilePath: string): Promise<void> {
    if (!localFilePath) return;

    try {
      await unlink(localFilePath);
      console.log(`🧹 [INFRA] Arquivo temporário removido: ${localFilePath}`);
    } catch (error: any) {
      // Falha silenciosa para evitar que erros de I/O interrompam o fluxo principal
      console.warn(
        `⚠️ [INFRA] Falha ao remover arquivo temporário (${localFilePath}):`,
        error.message
      );
    }
  }
}
