import { promises as fs } from 'fs';
import path from 'path';
import { News } from "../../entities/news_entity";
import { NewsDataRepository, DataSourceInfo } from "../news_data_repository";
import { 
  DataSourceNotFoundError,
  InvalidDataFormatError,
  DataSourceAccessError 
} from "../../errors";

/**
 * Implementação do repositório para leitura de notícias de arquivo JSON
 */
export class JsonNewsDataRepository implements NewsDataRepository {
  constructor(private readonly filePath: string) {}

  async loadNews(): Promise<News[]> {
    try {
      console.log(`📁 Carregando notícias do arquivo: ${this.filePath}`);
      
      // Verificar se o arquivo existe e é acessível
      await this.verifyFileAccess();
      
      // Ler conteúdo do arquivo
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      
      if (!fileContent.trim()) {
        throw new InvalidDataFormatError('File is empty');
      }

      // Parsear JSON
      let jsonData: any;
      try {
        jsonData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new InvalidDataFormatError(
          `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
          parseError instanceof Error ? parseError : undefined
        );
      }

      // Validar estrutura do JSON
      const news = this.validateAndExtractNews(jsonData);
      
      console.log(`✅ Carregadas ${news.length} notícias do arquivo`);
      return news;

    } catch (error) {
      if (error instanceof DataSourceNotFoundError || 
          error instanceof InvalidDataFormatError || 
          error instanceof DataSourceAccessError) {
        throw error;
      }
      
      throw new DataSourceAccessError(
        this.filePath,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async isSourceAvailable(): Promise<boolean> {
    try {
      await fs.access(this.filePath, fs.constants.F_OK | fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getSourceInfo(): Promise<DataSourceInfo> {
    try {
      const stats = await fs.stat(this.filePath);
      const absolutePath = path.resolve(this.filePath);
      
      return {
        sourceType: 'file',
        location: absolutePath,
        lastModified: stats.mtime,
        size: stats.size
      };
    } catch (error) {
      throw new DataSourceNotFoundError(
        this.filePath,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Verifica se o arquivo existe e pode ser lido
   */
  private async verifyFileAccess(): Promise<void> {
    try {
      await fs.access(this.filePath, fs.constants.F_OK);
    } catch {
      throw new DataSourceNotFoundError(this.filePath);
    }

    try {
      await fs.access(this.filePath, fs.constants.R_OK);
    } catch {
      throw new DataSourceAccessError(this.filePath);
    }
  }

  /**
   * Valida a estrutura do JSON e extrai as notícias
   */
  private validateAndExtractNews(jsonData: any): News[] {
    // Verificar se o JSON tem a estrutura esperada
    if (!jsonData || typeof jsonData !== 'object') {
      throw new InvalidDataFormatError('Root element must be an object');
    }

    if (!jsonData.news) {
      throw new InvalidDataFormatError('Missing "news" property in root object');
    }

    if (!Array.isArray(jsonData.news)) {
      throw new InvalidDataFormatError('"news" property must be an array');
    }

    const validatedNews: News[] = [];
    const errors: string[] = [];

    // Validar cada notícia individualmente
    jsonData.news.forEach((newsItem: any, index: number) => {
      try {
        const validatedNewsItem = this.validateNewsItem(newsItem, index);
        validatedNews.push(validatedNewsItem);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Item ${index}: ${errorMessage}`);
      }
    });

    // Se há muitos erros, considerar o arquivo inválido
    const errorThreshold = Math.ceil(jsonData.news.length * 0.5); // 50% de erro é inaceitável
    if (errors.length >= errorThreshold) {
      throw new InvalidDataFormatError(
        `Too many invalid news items (${errors.length}/${jsonData.news.length}). Errors: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`
      );
    }

    // Log de itens com erro, mas continua processamento
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} notícias foram ignoradas devido a erros de validação:`);
      errors.forEach(error => console.warn(`  - ${error}`));
    }

    return validatedNews;
  }

  /**
   * Valida um item individual de notícia
   */
  private validateNewsItem(newsItem: any, index: number): News {
    if (!newsItem || typeof newsItem !== 'object') {
      throw new Error(`must be an object`);
    }

    // Validar campos obrigatórios
    const requiredFields = ['title', 'content', 'source', 'categories', 'relevanceScore', 'language'];
    const missingFields = requiredFields.filter(field => !(field in newsItem));
    
    if (missingFields.length > 0) {
      throw new Error(`missing required fields: ${missingFields.join(', ')}`);
    }

    // Validar tipos
    if (typeof newsItem.title !== 'string' || !newsItem.title.trim()) {
      throw new Error('title must be a non-empty string');
    }

    if (typeof newsItem.content !== 'string' || !newsItem.content.trim()) {
      throw new Error('content must be a non-empty string');
    }

    if (typeof newsItem.source !== 'string' || !newsItem.source.trim()) {
      throw new Error('source must be a non-empty string');
    }

    if (!Array.isArray(newsItem.categories) || newsItem.categories.length === 0) {
      throw new Error('categories must be a non-empty array');
    }

    // Validar que todas as categorias são strings
    const invalidCategories = newsItem.categories.filter((cat: any) => typeof cat !== 'string' || !cat.trim());
    if (invalidCategories.length > 0) {
      throw new Error('all categories must be non-empty strings');
    }

    if (typeof newsItem.relevanceScore !== 'number' || newsItem.relevanceScore < 0 || newsItem.relevanceScore > 1) {
      throw new Error('relevanceScore must be a number between 0 and 1');
    }

    if (typeof newsItem.language !== 'string' || !newsItem.language.trim()) {
      throw new Error('language must be a non-empty string');
    }

    // Retornar objeto News validado
    return {
      title: newsItem.title.trim(),
      content: newsItem.content.trim(),
      source: newsItem.source.trim(),
      categories: newsItem.categories.map((cat: string) => cat.trim()),
      relevanceScore: newsItem.relevanceScore,
      language: newsItem.language.trim()
    };
  }
}