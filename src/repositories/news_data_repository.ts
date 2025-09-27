import { News } from "../entities/news_entity";
import {
  NewsDataRepositoryError,
  DataSourceNotFoundError,
  InvalidDataFormatError,
  DataSourceAccessError
} from "../errors";

/**
 * Repositório para leitura de dados de notícias de fontes externas
 * Esta interface permite diferentes implementações (JSON, XML, API, etc.)
 */
export interface NewsDataRepository {
  /**
   * Carrega notícias de uma fonte de dados
   * @returns Promise<News[]> Lista de notícias carregadas
   * @throws Error quando não consegue carregar os dados
   */
  loadNews(): Promise<News[]>;

  /**
   * Verifica se a fonte de dados está disponível
   * @returns Promise<boolean> true se a fonte está acessível
   */
  isSourceAvailable(): Promise<boolean>;

  /**
   * Obtém informações sobre a fonte de dados
   * @returns Promise<DataSourceInfo> Metadados da fonte
   */
  getSourceInfo(): Promise<DataSourceInfo>;
}

/**
 * Informações sobre a fonte de dados
 */
export interface DataSourceInfo {
  /** Tipo da fonte (file, api, database, etc.) */
  sourceType: string;
  /** Localização da fonte (path, URL, etc.) */
  location: string;
  /** Última modificação (se aplicável) */
  lastModified?: Date;
  /** Tamanho da fonte em bytes (se aplicável) */
  size?: number;
}

