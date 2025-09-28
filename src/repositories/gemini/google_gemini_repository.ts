import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmRepository, LlmResponse } from '../LLM_repository';
import { env } from '../../env';

/**
 * Implementação do repositório LLM usando Google Generative AI
 */
export class GoogleLlmRepository implements LlmRepository {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    try {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
      console.log(`✅ Gemini AI inicializado com modelo: ${env.GEMINI_MODEL}`);
    } catch (error) {
      console.error('❌ Erro ao inicializar Gemini AI:', error);
      throw new Error('Failed to initialize Gemini AI');
    }
  }

  async generateContent(prompt: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Enviando prompt para Gemini (${prompt.length} caracteres)...`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ Resposta recebida do Gemini em ${responseTime}ms (${text.length} caracteres)`);
      
      return text;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Erro ao comunicar com Gemini (${responseTime}ms):`, errorMessage);
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }

  async generateContentWithContext(prompt: string, context: string): Promise<string> {
    const fullPrompt = `Contexto: ${context}\n\nPrompt: ${prompt}`;
    return this.generateContent(fullPrompt);
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testando conexão com Gemini AI...');
      
      const testPrompt = "Responda apenas com 'OK' se você conseguir me ouvir.";
      const response = await this.generateContent(testPrompt);
      
      const isWorking = response.toLowerCase().includes('ok');
      
      if (isWorking) {
        console.log('✅ Conexão com Gemini AI funcionando corretamente');
      } else {
        console.warn('⚠️ Conexão com Gemini AI pode ter problemas - resposta inesperada:', response);
      }
      
      return isWorking;
    } catch (error) {
      console.error('❌ Falha no teste de conexão com Gemini AI:', error);
      return false;
    }
  }

  /**
   * Método auxiliar para gerar resposta com metadados completos
   */
  async generateContentWithMetadata(prompt: string): Promise<LlmResponse> {
    const startTime = Date.now();
    
    try {
      const content = await this.generateContent(prompt);
      const responseTime = Date.now() - startTime;
      
      return {
        content,
        success: true,
        metadata: {
          responseTime,
          model: env.GEMINI_MODEL,
          promptLength: prompt.length,
          responseLength: content.length
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        content: '',
        success: false,
        error: errorMessage,
        metadata: {
          responseTime,
          model: env.GEMINI_MODEL,
          promptLength: prompt.length,
          responseLength: 0
        }
      };
    }
  }
}