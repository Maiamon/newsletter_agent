import { News } from "../entities/news_entity";
import { LlmRepository } from "../repositories/LLM_repository";
import { GenerateSummaryUseCase } from "./generateSummary";
import { env } from "../env/index.js";

/**
 * Resultado da curadoria de notícias
 */
export interface CurationResult {
  /** Notícias aprovadas para inserção no banco */
  approvedNews: News[];
  /** Notícias rejeitadas com motivos */
  rejectedNews: RejectedNews[];
  /** Total de notícias processadas */
  totalProcessed: number;
  /** Total de notícias aprovadas */
  totalApproved: number;
  /** Total de notícias rejeitadas */
  totalRejected: number;
}

/**
 * Notícia rejeitada com motivo
 */
export interface RejectedNews {
  /** Notícia rejeitada */
  news: News;
  /** Motivos da rejeição */
  reasons: string[];
}

/**
 * Use case para curadoria de notícias
 * Filtra notícias baseado em critérios de qualidade:
 * - relevanceScore deve ser >= RELEVANCE_SCORE_THRESHOLD (configurável via env)
 * - language deve ser 'ptBR' ou 'EN'
 * - Gera resumo automaticamente se aprovada E content > 300 caracteres
 */
export class CurateNewsUseCase {
  private summaryUseCase: GenerateSummaryUseCase;

  constructor(private readonly llmRepository: LlmRepository) {
    this.summaryUseCase = new GenerateSummaryUseCase(llmRepository);
  }
  
  /**
   * Executa a curadoria das notícias
   * @param newsArray Array de notícias para curar
   * @returns Promise<CurationResult> Resultado da curadoria
   */
  async execute(newsArray: News[]): Promise<CurationResult> {
    console.log(`🎯 Iniciando curadoria de ${newsArray.length} notícias (threshold: ${env.RELEVANCE_SCORE_THRESHOLD})...`);

    const approvedNews: News[] = [];
    const rejectedNews: RejectedNews[] = [];

    for (const news of newsArray) {
      const rejectionReasons = this.evaluateNews(news);
      
      if (rejectionReasons.length === 0) {
        // Notícia aprovada nos critérios - verificar se precisa gerar resumo
        let processedNews = news;
        
        if (news.content.length > 300) {
          console.log(`📝 Notícia aprovada com conteúdo longo (${news.content.length} chars), gerando resumo...`);
          
          try {
            const summaryResult = await this.summaryUseCase.execute(news);
            
            if (summaryResult.success) {
              // Criar nova notícia com resumo no lugar do conteúdo
              processedNews = {
                ...news,
                content: summaryResult.summary
              };
              console.log(`✅ Resumo gerado: ${summaryResult.summary.length} caracteres`);
            } else {
              console.warn(`⚠️ Falha ao gerar resumo: ${summaryResult.error}`);
              // Continua com o conteúdo original se falhar
            }
            
          } catch (error) {
            console.error(`❌ Erro ao gerar resumo: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Continua com o conteúdo original se falhar
          }
        }
        
        approvedNews.push(processedNews);
        console.log(`✅ Aprovada: "${processedNews.title}" (Score: ${processedNews.relevanceScore}, Lang: ${processedNews.language}, Content: ${processedNews.content.length} chars)`);
      } else {
        // Notícia rejeitada - não gera resumo
        rejectedNews.push({
          news,
          reasons: rejectionReasons
        });
        console.log(`❌ Rejeitada: "${news.title}" - ${rejectionReasons.join(', ')}`);
      }
    }

    const result: CurationResult = {
      approvedNews,
      rejectedNews,
      totalProcessed: newsArray.length,
      totalApproved: approvedNews.length,
      totalRejected: rejectedNews.length
    };

    console.log(`📊 Curadoria concluída: ${result.totalApproved} aprovadas, ${result.totalRejected} rejeitadas`);
    
    return result;
  }

  /**
   * Avalia uma notícia e retorna os motivos de rejeição (se houver)
   * @param news Notícia para avaliar
   * @returns Array de motivos de rejeição (vazio se aprovada)
   */
  private evaluateNews(news: News): string[] {
    const reasons: string[] = [];

    // Verificar relevanceScore usando threshold configurável
    if (news.relevanceScore < env.RELEVANCE_SCORE_THRESHOLD) {
      reasons.push(`Score insuficiente (${news.relevanceScore} < ${env.RELEVANCE_SCORE_THRESHOLD})`);
    }

    // Verificar language
    if (news.language !== 'ptBR' && news.language !== 'EN') {
      reasons.push(`Idioma não suportado (${news.language})`);
    }

    return reasons;
  }
}