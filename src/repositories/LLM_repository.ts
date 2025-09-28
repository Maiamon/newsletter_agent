/**
 * Interface para integração com Gemini AI
 */
export interface LlmRepository {
  /**
   * Envia um prompt para o Gemini e retorna a resposta
   * @param prompt Texto do prompt a ser enviado
   * @returns Promise<string> Resposta do Gemini em texto
   */
  generateContent(prompt: string): Promise<string>;

  /**
   * Envia um prompt com contexto adicional
   * @param prompt Texto do prompt principal
   * @param context Contexto adicional para o prompt
   * @returns Promise<string> Resposta do Gemini em texto
   */
  generateContentWithContext(prompt: string, context: string): Promise<string>;

  /**
   * Verifica se a conexão com o Gemini está funcionando
   * @returns Promise<boolean> true se a conexão está ok
   */
  testConnection(): Promise<boolean>;
}

/**
 * Resultado de uma operação com o Gemini
 */
export interface LlmResponse {
  /** Conteúdo da resposta */
  content: string;
  /** Se a operação foi bem-sucedida */
  success: boolean;
  /** Mensagem de erro (se houver) */
  error?: string;
  /** Metadados da resposta */
  metadata?: {
    /** Tempo de resposta em ms */
    responseTime: number;
    /** Modelo usado */
    model: string;
    /** Tamanho do prompt em caracteres */
    promptLength: number;
    /** Tamanho da resposta em caracteres */
    responseLength: number;
  };
}