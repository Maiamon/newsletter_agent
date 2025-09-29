import { JsonNewsDataRepository } from './repositories/json/json_news_data_repository';
import { LoadNewsFromSourceUseCase } from './use-cases/loadNewsFromSource';
import { CurateNewsUseCase } from './use-cases/curateNews';
import { DBRepository } from './repositories/db/db_repository';
import { GoogleLlmRepository } from './repositories/gemini/google_gemini_repository';
import { env } from './env/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Aplicação principal para processar notícias do JSON e inserir no banco
 */
class NewsletterApp {
  async run(): Promise<void> {
    console.log('🚀 === Newsletter Agent - Iniciando Aplicação ===\n');

    try {
      // 1. Configurar repositórios e use cases
      const dbRepository = new DBRepository();
      const llmRepository = new GoogleLlmRepository();
      
      // Usar path configurável via environment variable
      const jsonFilePath = path.isAbsolute(env.SOURCE_DATA_PATH) 
        ? env.SOURCE_DATA_PATH 
        : path.join(__dirname, '..', env.SOURCE_DATA_PATH);
        
      const newsDataRepository = new JsonNewsDataRepository(jsonFilePath);
      const loadNewsUseCase = new LoadNewsFromSourceUseCase(newsDataRepository);
      const curateNewsUseCase = new CurateNewsUseCase(llmRepository);

      // 2. Conectar ao banco de dados
      console.log('🔌 Conectando ao banco de dados...');
      const connected = await dbRepository.testConnection();
      
      if (!connected) {
        console.error('❌ Falha na conexão com o banco de dados');
        process.exit(1);
      }
      
      console.log('✅ Conexão com banco estabelecida\n');

      // 3. Carregar notícias do arquivo JSON
      console.log(`📁 Carregando notícias do arquivo: ${path.basename(jsonFilePath)}...`);
      console.log(`   📂 Path completo: ${jsonFilePath}`);
      const loadResult = await loadNewsUseCase.execute();

      if (loadResult.news.length === 0) {
        console.warn('⚠️ Nenhuma notícia foi carregada do arquivo');
        return;
      }

      console.log(`✅ ${loadResult.totalLoaded} notícias carregadas do arquivo\n`);

      // 4. Curar notícias (filtrar por qualidade)
      console.log('🎯 Iniciando curadoria das notícias...');
      const curationResult = await curateNewsUseCase.execute(loadResult.news);

      if (curationResult.totalApproved === 0) {
        console.warn('⚠️ Nenhuma notícia foi aprovada na curadoria');
        console.log(`📊 Motivos das rejeições:`);
        curationResult.rejectedNews.forEach(rejected => {
          console.log(`  - "${rejected.news.title}": ${rejected.reasons.join(', ')}`);
        });
        return;
      }

      console.log(`✅ ${curationResult.totalApproved} notícias aprovadas na curadoria\n`);

      // 5. Inserir notícias aprovadas no banco de dados
      console.log('💾 Inserindo notícias aprovadas no banco de dados...');
      const insertResults = await this.insertMultipleNews(dbRepository, curationResult.approvedNews);

      // 6. Relatório final
      const successCount = insertResults.filter(result => result !== null).length;
      console.log(`\n📊 === Relatório Final ===`);
      console.log(`📁 Total carregado do arquivo: ${loadResult.totalLoaded}`);
      console.log(`🎯 Total processado na curadoria: ${curationResult.totalProcessed}`);
      console.log(`✅ Total aprovado na curadoria: ${curationResult.totalApproved}`);
      console.log(`❌ Total rejeitado na curadoria: ${curationResult.totalRejected}`);
      console.log(`💾 Inseridas com sucesso no banco: ${successCount}`);
      
      if (curationResult.totalRejected > 0) {
        console.log(`\n📋 Motivos das rejeições:`);
        curationResult.rejectedNews.forEach(rejected => {
          console.log(`  - "${rejected.news.title.substring(0, 50)}...": ${rejected.reasons.join(', ')}`);
        });
      }
      
      console.log(`\n🎉 Processamento concluído com sucesso!`);

      await dbRepository.close();

    } catch (error) {
      console.error('❌ Erro durante execução:', error);
      process.exit(1);
    }
  }

  /**
   * Insere múltiplas notícias no banco
   */
  private async insertMultipleNews(dbRepository: DBRepository, newsArray: any[]): Promise<(any | null)[]> {
    const results: (any | null)[] = [];
    
    for (const news of newsArray) {
      try {
        const result = await dbRepository.insertNews(news);
        results.push(result);
        
        if (result) {
          console.log(`✅ Notícia salva: "${result.title}"`);
        }
      } catch (error) {
        console.error(`❌ Erro ao salvar "${news.title}":`, error);
        results.push(null);
      }
    }
    
    return results;
  }
}

/**
 * Função principal - ponto de entrada da aplicação
 */
async function main() {
  const app = new NewsletterApp();
  await app.run();
}

// Executar aplicação
main().catch((error) => {
  console.error('💥 Erro não tratado:', error);
  process.exit(1);
});

export { NewsletterApp, main };
