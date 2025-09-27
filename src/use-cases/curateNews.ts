import { News } from "../entities/news_entity";

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
 * - relevanceScore deve ser >= 0.7
 * - language deve ser 'ptBR' ou 'EN'
 */
export class CurateNewsUseCase {
  
  /**
   * Executa a curadoria das notícias
   * @param newsArray Array de notícias para curar
   * @returns Promise<CurationResult> Resultado da curadoria
   */
  async execute(newsArray: News[]): Promise<CurationResult> {
    console.log(`🎯 Iniciando curadoria de ${newsArray.length} notícias...`);

    const approvedNews: News[] = [];
    const rejectedNews: RejectedNews[] = [];

    for (const news of newsArray) {
      const rejectionReasons = this.evaluateNews(news);
      
      if (rejectionReasons.length === 0) {
        // Notícia aprovada
        approvedNews.push(news);
        console.log(`✅ Aprovada: "${news.title}" (Score: ${news.relevanceScore}, Lang: ${news.language})`);
      } else {
        // Notícia rejeitada
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

    // Verificar relevanceScore
    if (news.relevanceScore < 0.7) {
      reasons.push(`Score insuficiente (${news.relevanceScore} < 0.7)`);
    }

    // Verificar language
    if (news.language !== 'ptBR' && news.language !== 'EN') {
      reasons.push(`Idioma não suportado (${news.language})`);
    }

    return reasons;
  }
}