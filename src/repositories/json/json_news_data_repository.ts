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
 * Implementação simples do repositório para leitura de notícias de arquivo JSON
 */
export class JsonNewsDataRepository implements NewsDataRepository {
  constructor(private readonly filePath: string) {}

  async loadNews(): Promise<News[]> {
    try {
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      
      if (!fileContent.trim()) {
        throw new InvalidDataFormatError('File is empty');
      }

      let jsonData: any;
      try {
        jsonData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new InvalidDataFormatError(
          `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
          parseError instanceof Error ? parseError : undefined
        );
      }
      
      if (!jsonData.news || !Array.isArray(jsonData.news)) {
        throw new InvalidDataFormatError('Invalid JSON structure: missing news array');
      }

      return jsonData.news.map((item: any) => ({
        title: item.title,
        content: item.content,
        source: item.source,
        categories: item.categories,
        relevanceScore: item.relevanceScore,
        language: item.language
      }));

    } catch (error) {
      if (error instanceof InvalidDataFormatError) {
        throw error;
      }
      
      if ((error as any).code === 'ENOENT') {
        throw new DataSourceNotFoundError(this.filePath);
      }
      
      if ((error as any).code === 'EACCES') {
        throw new DataSourceAccessError(this.filePath);
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
      if ((error as any).code === 'ENOENT') {
        throw new DataSourceNotFoundError(this.filePath);
      }
      
      throw new DataSourceAccessError(
        this.filePath,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}