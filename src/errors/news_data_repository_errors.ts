/**
 * Exceções específicas para operações de repositório de dados
 */
export class NewsDataRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'NewsDataRepositoryError';
  }
}

/**
 * Erro quando a fonte de dados não é encontrada
 */
export class DataSourceNotFoundError extends NewsDataRepositoryError {
  constructor(location: string, cause?: Error) {
    super(`Data source not found: ${location}`, 'DATA_SOURCE_NOT_FOUND', cause);
    this.name = 'DataSourceNotFoundError';
  }
}

/**
 * Erro quando o formato dos dados é inválido
 */
export class InvalidDataFormatError extends NewsDataRepositoryError {
  constructor(details: string, cause?: Error) {
    super(`Invalid data format: ${details}`, 'INVALID_DATA_FORMAT', cause);
    this.name = 'InvalidDataFormatError';
  }
}

/**
 * Erro quando não é possível acessar a fonte
 */
export class DataSourceAccessError extends NewsDataRepositoryError {
  constructor(location: string, cause?: Error) {
    super(`Cannot access data source: ${location}`, 'DATA_SOURCE_ACCESS_ERROR', cause);
    this.name = 'DataSourceAccessError';
  }
}