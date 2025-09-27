import { News } from "../entities/news_entity";
import { NewsDataRepository } from "../repositories/news_data_repository";

/**
 * Resultado da execução do caso de uso
 */
export interface LoadNewsResult {
  /** Notícias carregadas com sucesso */
  news: News[];
  /** Total de notícias carregadas */
  totalLoaded: number;
}

export class LoadNewsFromSourceUseCase {
  constructor(private readonly newsDataRepository: NewsDataRepository) {}

  /**
   * Executa o carregamento de notícias
   * @returns Promise<LoadNewsResult> Resultado da operação
   */
  async execute(): Promise<LoadNewsResult> {
    try {
      // Verificar se a fonte de dados está disponível
      const isAvailable = await this.newsDataRepository.isSourceAvailable();
      if (!isAvailable) {
        throw new Error('Data source is not available');
      }

      // Carregar notícias da fonte
      const news = await this.newsDataRepository.loadNews();

      return {
        news,
        totalLoaded: news.length
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Erro durante carregamento: ${errorMessage}`);
      
      return {
        news: [],
        totalLoaded: 0
      };
    }
  }
}
