/**
 * Exceções específicas para casos de uso
 */
export class UseCaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'UseCaseError';
  }
}

/**
 * Erro quando a validação de entrada falha
 */
export class ValidationError extends UseCaseError {
  constructor(field: string, value: any, constraint: string, cause?: Error) {
    super(`Validation failed for field '${field}' with value '${value}': ${constraint}`, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

/**
 * Erro quando uma operação de negócio falha
 */
export class BusinessRuleError extends UseCaseError {
  constructor(rule: string, details: string, cause?: Error) {
    super(`Business rule violation '${rule}': ${details}`, 'BUSINESS_RULE_ERROR', cause);
    this.name = 'BusinessRuleError';
  }
}

/**
 * Erro quando um recurso não é encontrado
 */
export class NotFoundError extends UseCaseError {
  constructor(resource: string, identifier: string, cause?: Error) {
    super(`${resource} not found with identifier: ${identifier}`, 'NOT_FOUND_ERROR', cause);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro quando há conflito de recursos (ex: duplicação)
 */
export class ConflictError extends UseCaseError {
  constructor(resource: string, details: string, cause?: Error) {
    super(`Conflict with ${resource}: ${details}`, 'CONFLICT_ERROR', cause);
    this.name = 'ConflictError';
  }
}