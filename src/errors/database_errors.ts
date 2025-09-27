/**
 * Exceções específicas para operações de banco de dados
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly operation?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Erro de conexão com o banco de dados
 */
export class DatabaseConnectionError extends DatabaseError {
  constructor(details: string, cause?: Error) {
    super(`Database connection failed: ${details}`, 'DATABASE_CONNECTION_ERROR', 'connect', cause);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Erro de constraint/restrição do banco
 */
export class DatabaseConstraintError extends DatabaseError {
  constructor(constraint: string, table: string, cause?: Error) {
    super(`Database constraint violation '${constraint}' on table '${table}'`, 'DATABASE_CONSTRAINT_ERROR', 'insert/update', cause);
    this.name = 'DatabaseConstraintError';
  }
}

/**
 * Erro de transação do banco
 */
export class DatabaseTransactionError extends DatabaseError {
  constructor(operation: string, details: string, cause?: Error) {
    super(`Transaction failed during ${operation}: ${details}`, 'DATABASE_TRANSACTION_ERROR', operation, cause);
    this.name = 'DatabaseTransactionError';
  }
}

/**
 * Erro quando uma query SQL falha
 */
export class DatabaseQueryError extends DatabaseError {
  constructor(query: string, details: string, cause?: Error) {
    super(`Query execution failed: ${details}`, 'DATABASE_QUERY_ERROR', 'query', cause);
    this.name = 'DatabaseQueryError';
  }
}