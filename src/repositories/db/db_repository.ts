import { NewsRepository, CategoryModel, NewsWithCategoriesModel, NewsModel } from "../news_repository";
import { News } from "../../entities/news_entity";
import { Pool, PoolClient } from 'pg';
import { env } from '../../env/index.js';

export class DBRepository implements NewsRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
      max: 20,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    });

    // Event listeners para debugging
    this.pool.on('connect', () => {
      console.log('✅ Repository conectado ao banco PostgreSQL');
    });

    this.pool.on('error', (err) => {
      console.error('❌ Erro na conexão do Repository com PostgreSQL:', err);
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      console.log('🔌 Testando conexão com o banco via Repository...');
      
      const result = await client.query('SELECT NOW()');
      console.log('⏰ Horário do banco:', result.rows[0].now);
      
      client.release();
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar no banco via Repository:', error);
      return false;
    }
  }

  async insertNews(newsData: News): Promise<News | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Inserir notícia usando campos do schema Prisma
      const newsQuery = `
        INSERT INTO news (title, content, source, "publishedAt")
        VALUES ($1, $2, $3, NOW())
        RETURNING id, title, content, source, "publishedAt"
      `;
      
      const newsResult = await client.query(newsQuery, [
        newsData.title,
        newsData.content,
        newsData.source
      ]);

      const insertedNews = newsResult.rows[0];
      const newsId = insertedNews.id;
      console.log(`📰 Notícia inserida com ID: ${newsId}`);

      // Se tiver categorias, associar à notícia
      if (newsData.categories && newsData.categories.length > 0) {
        for (const categoryName of newsData.categories) {
          // Buscar ou criar categoria
          const categoryId = await this.getOrCreateCategory(client, categoryName);
          
          // Associar categoria à notícia (tabela many-to-many do Prisma)
          await client.query(
            'INSERT INTO "_CategoryToNews" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [categoryId, newsId]
          );
        }
        console.log(`🏷️ Categorias associadas à notícia ${newsId}`);
      }

      await client.query('COMMIT');

      // Retornar objeto News simplificado
      return {
        title: insertedNews.title,
        content: insertedNews.content,
        source: insertedNews.source,
        categories: newsData.categories || [],
        relevanceScore: insertedNews.relevance_score,
        language: insertedNews.language
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro ao inserir notícia:', error);
      return null;
    } finally {
      client.release();
    }
  }

  async insertCategory(categoryData: { name: string }): Promise<CategoryModel | null> {
    try {
      const query = `
        INSERT INTO categories (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
        RETURNING id, name
      `;

      const result = await this.pool.query(query, [categoryData.name]);
      
      if (result.rows.length > 0) {
        console.log(`🏷️ Categoria inserida com ID: ${result.rows[0].id}`);
        return {
          id: result.rows[0].id,
          name: result.rows[0].name
        };
      } else {
        // Categoria já existe, buscar ID
        const existingResult = await this.pool.query(
          'SELECT id, name FROM categories WHERE name = $1',
          [categoryData.name]
        );
        console.log(`🏷️ Categoria '${categoryData.name}' já existe com ID: ${existingResult.rows[0].id}`);
        return {
          id: existingResult.rows[0].id,
          name: existingResult.rows[0].name
        };
      }

    } catch (error) {
      console.error('❌ Erro ao inserir categoria:', error);
      return null;
    }
  }

  async getAllNews(): Promise<NewsWithCategoriesModel[]> {
    try {
      const query = `
        SELECT 
          n.id,
          n.title,
          n.content,
          n.source,
          n.summary,
          n."publishedAt" as published_at,
          COALESCE(
            ARRAY_AGG(
              CASE WHEN c.id IS NOT NULL 
              THEN json_build_object('id', c.id, 'name', c.name)
              ELSE NULL END
            ) FILTER (WHERE c.id IS NOT NULL),
            '{}'::json[]
          ) as categories
        FROM news n
        LEFT JOIN "_CategoryToNews" cn ON n.id = cn."B"
        LEFT JOIN categories c ON cn."A" = c.id
        GROUP BY n.id, n.title, n.content, n.source, n.summary, n."publishedAt"
        ORDER BY n."publishedAt" DESC
      `;

      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        title: row.title,
        content: row.content,
        source: row.source,
        summary: row.summary,
        published_at: row.published_at,
        categories: row.categories || []
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar notícias:', error);
      return [];
    }
  }

  async getAllCategories(): Promise<CategoryModel[]> {
    try {
      const query = 'SELECT id, name FROM categories ORDER BY name';
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return [];
    }
  }



  private async getOrCreateCategory(client: PoolClient, categoryName: string): Promise<number> {
    // Tentar buscar categoria existente
    const searchResult = await client.query(
      'SELECT id FROM categories WHERE name = $1',
      [categoryName]
    );

    if (searchResult.rows.length > 0) {
      return searchResult.rows[0].id;
    }

    // Criar nova categoria
    const insertResult = await client.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id',
      [categoryName]
    );

    return insertResult.rows[0].id;
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('🔌 Conexão do Repository com banco fechada');
  }
}