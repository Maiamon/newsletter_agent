import { News } from "../entities/news_entity";
import { NewsDataRepository } from "../repositories/news_data_repository";

/**
 * Resultado da execução do caso de uso
 */
export interface LoadNewsResult {
  /** Notícias carregadas com sucesso */
  news: News[];
  /** Metadados da operação */
  metadata: {
    /** Total de notícias encontradas na fonte */
    totalFound: number;
    /** Total de notícias carregadas com sucesso */
    totalLoaded: number;
    /** Tempo de execução em milissegundos */
    executionTimeMs: number;
    /** Informações da fonte de dados */
    sourceInfo: {
      type: string;
      location: string;
      lastModified?: Date;
      size?: number;
    };
  };
  /** Erros encontrados durante o processamento */
  errors: string[];
}

/**
 * Caso de uso para carregar notícias de uma fonte de dados
 * 
 * Responsabilidades:
 * - Coordenar a operação de carregamento
 * - Aplicar validações de negócio
 * - Coletar métricas de execução
 * - Fornecer feedback detalhado sobre a operação
 */
export class LoadNewsFromJsonUseCase {
  constructor(private readonly newsDataRepository: NewsDataRepository) {}

  /**
   * Executa o carregamento de notícias
   * @returns Promise<LoadNewsResult> Resultado detalhado da operação
   */
  async execute(): Promise<LoadNewsResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let news: News[] = [];
    let sourceInfo: any = null;

    try {
      console.log('🚀 Iniciando carregamento de notícias...');

      // 1. Verificar disponibilidade da fonte
      const isAvailable = await this.newsDataRepository.isSourceAvailable();
      if (!isAvailable) {
        throw new Error('Data source is not available');
      }

      // 2. Obter informações da fonte
      try {
        sourceInfo = await this.newsDataRepository.getSourceInfo();
        console.log(`📊 Fonte: ${sourceInfo.sourceType} (${sourceInfo.location})`);
        if (sourceInfo.size) {
          console.log(`📏 Tamanho: ${this.formatBytes(sourceInfo.size)}`);
        }
        if (sourceInfo.lastModified) {
          console.log(`📅 Última modificação: ${sourceInfo.lastModified.toLocaleString('pt-BR')}`);
        }
      } catch (error) {
        const errorMsg = `Failed to get source info: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.warn(`⚠️ ${errorMsg}`);
      }

      // 3. Carregar notícias
      news = await this.newsDataRepository.loadNews();

      // 4. Aplicar validações de negócio (DESABILITADO - inserir todas as notícias)
      // const validatedNews = this.applyBusinessValidations(news);
      // const rejectedCount = news.length - validatedNews.length;
      // if (rejectedCount > 0) {
      //   const rejectionMsg = `${rejectedCount} news items were rejected by business validations`;
      //   errors.push(rejectionMsg);
      //   console.warn(`⚠️ ${rejectionMsg}`);
      // }
      // news = validatedNews;

      const executionTime = Date.now() - startTime;
      console.log(`✅ Carregamento concluído em ${executionTime}ms`);
      console.log(`📰 ${news.length} notícias carregadas com sucesso`);

      return {
        news,
        metadata: {
          totalFound: news.length, // Sem validações = total encontrado = total carregado
          totalLoaded: news.length,
          executionTimeMs: executionTime,
          sourceInfo: {
            type: sourceInfo?.sourceType || 'unknown',
            location: sourceInfo?.location || 'unknown',
            lastModified: sourceInfo?.lastModified,
            size: sourceInfo?.size
          }
        },
        errors
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.error(`❌ Erro durante carregamento: ${errorMessage}`);
      
      return {
        news: [],
        metadata: {
          totalFound: 0,
          totalLoaded: 0,
          executionTimeMs: executionTime,
          sourceInfo: {
            type: sourceInfo?.sourceType || 'unknown',
            location: sourceInfo?.location || 'unknown',
            lastModified: sourceInfo?.lastModified,
            size: sourceInfo?.size
          }
        },
        errors: [errorMessage, ...errors]
      };
    }
  }

  /**
   * Aplica validações de regras de negócio específicas
   * Por exemplo: filtros adicionais, transformações, etc.
   */
  private applyBusinessValidations(news: News[]): News[] {
    const validatedNews: News[] = [];

    for (const newsItem of news) {
      // Exemplo de validações de negócio
      
      // 1. Validar tamanho mínimo do conteúdo
      if (newsItem.content.length < 50) {
        console.warn(`⏭️ Notícia "${newsItem.title}" rejeitada: conteúdo muito curto (${newsItem.content.length} caracteres)`);
        continue;
      }

      // 2. Validar tamanho máximo do conteúdo
      if (newsItem.content.length > 10000) {
        console.warn(`⏭️ Notícia "${newsItem.title}" rejeitada: conteúdo muito longo (${newsItem.content.length} caracteres)`);
        continue;
      }

      // 3. Validar título não vazio após trim
      if (!newsItem.title.trim()) {
        console.warn(`⏭️ Notícia rejeitada: título vazio`);
        continue;
      }

      // 4. Validar se tem pelo menos uma categoria
      if (newsItem.categories.length === 0) {
        console.warn(`⏭️ Notícia "${newsItem.title}" rejeitada: sem categorias`);
        continue;
      }

      // Se passou em todas as validações, incluir na lista
      validatedNews.push(newsItem);
    }

    return validatedNews;
  }

  /**
   * Formata bytes em formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Factory function para criar o caso de uso com repositório JSON padrão
 */
export function createLoadNewsFromJsonUseCase(filePath?: string): LoadNewsFromJsonUseCase {
  // Lazy import para evitar dependências circulares
  const { JsonNewsDataRepository } = require('../repositories/json/json_news_data_repository');
  const path = require('path');
  
  const defaultPath = filePath || path.join(__dirname, '..', 'data', 'source-data.json');
  const repository = new JsonNewsDataRepository(defaultPath);
  
  return new LoadNewsFromJsonUseCase(repository);
}
