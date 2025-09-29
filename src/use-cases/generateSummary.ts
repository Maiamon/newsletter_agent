import { News } from "../entities/news_entity";
import { LlmRepository } from "../repositories/LLM_repository";
import { env } from "../env/index.js";

/**
 * Resultado da geração de resumo
 */
export interface GenerateSummaryResult {
  /** Resumo gerado */
  summary: string;
  /** Notícia original */
  originalNews: News;
  /** Se a operação foi bem-sucedida */
  success: boolean;
  /** Mensagem de erro (se houver) */
  error?: string;
  /** Metadados da geração */
  metadata?: {
    /** Tempo de processamento em ms */
    processingTime: number;
    /** Tamanho do conteúdo original */
    originalLength: number;
    /** Tamanho do resumo gerado */
    summaryLength: number;
    /** Taxa de compressão (summary/original) */
    compressionRatio: number;
  };
}

/**
 * Use case para gerar resumos de notícias usando LLM
 * Cria resumos concisos com tamanho configurável via SUMMARY_MAX_LENGTH
 */
export class GenerateSummaryUseCase {
  
  constructor(private readonly llmRepository: LlmRepository) {}

  /**
   * Gera um resumo para uma notícia usando LLM
   * @param news Notícia para criar resumo
   * @returns Promise<GenerateSummaryResult> Resultado da geração
   */
  async execute(news: News): Promise<GenerateSummaryResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📝 Gerando resumo para: "${news.title}"`);
      
      // Criar prompt otimizado para resumo
      const prompt = this.createSummaryPrompt(news);
      
      // Gerar conteúdo usando LLM
      const summary = await this.llmRepository.generateContent(prompt);
      
      // Validar tamanho do resumo usando configuração
      const trimmedSummary = summary.trim();
      const maxLength = env.SUMMARY_MAX_LENGTH;
      
      if (trimmedSummary.length > maxLength) {
        console.warn(`⚠️ Resumo muito longo (${trimmedSummary.length} caracteres), tentando encurtar...`);
        
        // Tentar gerar um resumo mais curto
        const shorterSummary = await this.generateShorterSummary(news, trimmedSummary);
        const finalSummary = shorterSummary.length <= maxLength ? shorterSummary : trimmedSummary.substring(0, maxLength - 3) + '...';
        
        return this.createResult(news, finalSummary, true, startTime);
      }
      
      return this.createResult(news, trimmedSummary, true, startTime);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Erro ao gerar resumo para "${news.title}":`, errorMessage);
      
      return {
        summary: '',
        originalNews: news,
        success: false,
        error: errorMessage,
        metadata: {
          processingTime: Date.now() - startTime,
          originalLength: news.content.length,
          summaryLength: 0,
          compressionRatio: 0
        }
      };
    }
  }

  /**
   * Gera múltiplos resumos em lote
   * @param newsArray Array de notícias
   * @returns Promise<GenerateSummaryResult[]> Resultados das gerações
   */
  async executeBatch(newsArray: News[]): Promise<GenerateSummaryResult[]> {
    console.log(`📚 Gerando resumos para ${newsArray.length} notícias...`);
    
    const results: GenerateSummaryResult[] = [];
    
    for (const news of newsArray) {
      const result = await this.execute(news);
      results.push(result);
      
      // Pequena pausa entre requests para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ ${successCount}/${newsArray.length} resumos gerados com sucesso`);
    
    return results;
  }

  /**
   * Cria o prompt otimizado para gerar resumo
   */
  private createSummaryPrompt(news: News): string {
    const maxLength = env.SUMMARY_MAX_LENGTH;
    return `Você é um especialista em criação de resumos jornalísticos concisos e impactantes.

TAREFA: Crie um resumo da notícia abaixo em MÁXIMO ${maxLength} caracteres.

REGRAS IMPORTANTES:
- Use linguagem clara e objetiva
- Mantenha as informações mais relevantes
- Não use aspas ou marcações especiais
- Foque nos fatos principais
- Mantenha o tom jornalístico

NOTÍCIA:
Título: ${news.title}
Conteúdo: ${news.content}

RESUMO (máximo ${maxLength} caracteres):`;
  }

  /**
   * Tenta gerar um resumo mais curto quando o primeiro excede o limite
   */
  private async generateShorterSummary(news: News, originalSummary: string): Promise<string> {
    const maxLength = env.SUMMARY_MAX_LENGTH;
    const prompt = `Você recebeu este resumo mas ele está muito longo. Encurte-o para MÁXIMO ${maxLength} caracteres mantendo as informações essenciais:

RESUMO ORIGINAL: ${originalSummary}

TÍTULO DA NOTÍCIA: ${news.title}

RESUMO ENCURTADO (máximo ${maxLength} caracteres):`;

    try {
      const shorterSummary = await this.llmRepository.generateContent(prompt);
      return shorterSummary.trim();
    } catch (error) {
      console.warn('⚠️ Erro ao encurtar resumo, usando versão truncada');
      return originalSummary.substring(0, maxLength - 3) + '...';
    }
  }

  /**
   * Cria o objeto de resultado padronizado
   */
  private createResult(news: News, summary: string, success: boolean, startTime: number): GenerateSummaryResult {
    const processingTime = Date.now() - startTime;
    const originalLength = news.content.length;
    const summaryLength = summary.length;
    
    console.log(`✅ Resumo gerado em ${processingTime}ms (${originalLength} → ${summaryLength} caracteres)`);
    
    return {
      summary,
      originalNews: news,
      success,
      metadata: {
        processingTime,
        originalLength,
        summaryLength,
        compressionRatio: originalLength > 0 ? summaryLength / originalLength : 0
      }
    };
  }
}