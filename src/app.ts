import { createLoadNewsFromJsonUseCase } from './use-cases/loadNewsFromSource';
import { DBRepository } from './repositories/db/db_repository';
import path from 'path';

/**
 * Aplicação principal para processar notícias do JSON e inserir no banco
 */
class NewsletterApp {
  private dbRepository: DBRepository;

  constructor() {
    this.dbRepository = new DBRepository();
  }
  
  /**
   * Executa o processo completo de carregamento e inserção de notícias
   */
  async run(): Promise<void> {
    console.log('🚀 === Newsletter Agent - Iniciando Aplicação ===\n');

    try {
      // 1. Conectar ao banco de dados
      console.log('🔌 Conectando ao banco de dados...');
      const connected = await this.dbRepository.testConnection();
      
      if (!connected) {
        console.error('❌ Falha na conexão com o banco de dados');
        console.error('   Certifique-se de que o PostgreSQL está rodando');
        process.exit(1);
      }
      
      console.log('✅ Conexão com banco estabelecida\n');

      // 2. Carregar notícias do arquivo JSON
      console.log('📁 Carregando notícias do arquivo source-data.json...');
      const loadNewsUseCase = createLoadNewsFromJsonUseCase();
      const loadResult = await loadNewsUseCase.execute();

      // Verificar se houve erros no carregamento
      if (loadResult.errors.length > 0) {
        console.warn('⚠️ Erros durante carregamento:');
        loadResult.errors.forEach(error => console.warn(`   - ${error}`));
      }

      if (loadResult.news.length === 0) {
        console.warn('⚠️ Nenhuma notícia foi carregada do arquivo');
        return;
      }

      console.log(`✅ ${loadResult.news.length} notícias carregadas do arquivo\n`);

      // 3. Inserir notícias no banco de dados
      console.log('💾 Inserindo notícias no banco de dados...');
      const insertResults = await this.insertMultipleNews(loadResult.news);

      // Contar sucessos e falhas
      const successCount = insertResults.filter((result: any) => result !== null).length;
      const failureCount = insertResults.length - successCount;

      console.log(`\n📊 === Relatório Final ===`);
      console.log(`📁 Arquivo processado: ${loadResult.metadata.sourceInfo.location}`);
      console.log(`📏 Tamanho do arquivo: ${this.formatBytes(loadResult.metadata.sourceInfo.size || 0)}`);
      console.log(`⏱️ Tempo de carregamento: ${loadResult.metadata.executionTimeMs}ms`);
      console.log(`🔍 Total encontrado no arquivo: ${loadResult.metadata.totalFound}`);
      console.log(`📰 Total carregado: ${loadResult.metadata.totalLoaded}`);
      console.log(`✅ Inseridas com sucesso: ${successCount}`);
      
      if (failureCount > 0) {
        console.log(`❌ Falhas na inserção: ${failureCount}`);
      }
      
      console.log(`\n🎉 Processamento concluído com sucesso!`);

      // 4. Mostrar algumas estatísticas do banco
      await this.showDatabaseStats();

    } catch (error) {
      console.error('❌ Erro fatal durante execução:', error);
      process.exit(1);
    } finally {
      // Fechar conexão com o banco
      await this.dbRepository.close();
      console.log('\n👋 Aplicação finalizada');
    }
  }

  /**
   * Insere múltiplas notícias no banco
   */
  private async insertMultipleNews(newsArray: any[]): Promise<(any | null)[]> {
    console.log(`📰 Salvando ${newsArray.length} notícias...`);
    
    const results: (any | null)[] = [];
    
    for (const news of newsArray) {
      try {
        const result = await this.dbRepository.insertNews(news);
        results.push(result);
        
        if (result) {
          console.log(`✅ Notícia salva: "${result.title}"`);
        }
        
        // Pequena pausa para não sobrecarregar o banco
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Erro ao salvar "${news.title}":`, error);
        results.push(null);
      }
    }

    const successCount = results.filter(r => r !== null).length;
    console.log(`✅ ${successCount}/${newsArray.length} notícias salvas com sucesso`);
    
    return results;
  }

  /**
   * Mostra estatísticas do banco de dados
   */
  private async showDatabaseStats(): Promise<void> {
    try {
      console.log('\n📈 === Estatísticas do Banco ===');
      
      const allNews = await this.dbRepository.getAllNews();
      const allCategories = await this.dbRepository.getAllCategories();
      
      console.log(`📰 Total de notícias no banco: ${allNews.length}`);
      console.log(`🏷️ Total de categorias: ${allCategories.length}`);
      
      if (allCategories.length > 0) {
        console.log(`📋 Categorias disponíveis: ${allCategories.map((cat: any) => cat.name).join(', ')}`);
      }

      // Mostrar últimas notícias inseridas
      if (allNews.length > 0) {
        console.log('\n📰 Últimas notícias no banco:');
        allNews.slice(0, 3).forEach((news: any, index: number) => {
          console.log(`${index + 1}. ${news.title}`);
          console.log(`   📅 ${new Date(news.published_at).toLocaleString('pt-BR')}`);
          console.log(`   🏷️ ${news.categories.map((c: any) => c.name).join(', ')}`);
        });
      }

    } catch (error) {
      console.warn('⚠️ Não foi possível obter estatísticas do banco:', error);
    }
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
 * Função principal - ponto de entrada da aplicação
 */
async function main() {
  const app = new NewsletterApp();
  await app.run();
}

// Executar aplicação se chamada diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Erro não tratado:', error);
    process.exit(1);
  });
}

export { NewsletterApp, main };
