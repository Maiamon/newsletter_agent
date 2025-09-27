# 📰 Newsletter Agent - Serviço de Banco de Dados

Este projeto contém um agente para inserir dados no banco PostgreSQL do sistema de newsletter.

## 🚀 Configuração

### 1. Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 18+ 
- Banco PostgreSQL rodando (via docker-compose do backend)

### 2. Instalação
```bash
# Instalar dependências
npm install

### 3. Configuração de Ambiente
Configure o arquivo `.env` dessa forma para conectar no banco do Docker Compose localmente:
```
DATABASE_URL=postgresql://newsletter:newsletter123@localhost:5432/newsletter_db
PGHOST=localhost
PGPORT=5432
PGUSER=newsletter
PGPASSWORD=newsletter123
PGDATABASE=newsletter_db
```

## 📋 Scripts Disponíveis

# Modo desenvolvimento (watch)
npm run dev

# Build para produção
npm run build
```

## 🔧 Como Usar o Serviço

### Importar o serviço
```typescript
import { newsService, connectDB } from './services/news_service';
import { News } from './entities/news_entity';
```

### Conectar ao banco
```typescript
const connected = await connectDB();
if (!connected) {
  console.log('Erro na conexão');
  return;
}
```

### Inserir notícia
```typescript
const noticiaData: NewsData = {
  title: 'Título da Notícia',
  summary: 'Resumo opcional',
  source: 'Fonte da notícia',
  content: 'Conteúdo completo da notícia...',
  categories: ['Tecnologia', 'IA'] // Opcional
};

const newsId = await dbService.insertNews(noticiaData);
console.log(\`Notícia inserida com ID: \${newsId}\`);
```

### Inserir categoria
```typescript
const categoryId = await dbService.insertCategory({ name: 'Nova Categoria' });
```

### Inserir usuário
```typescript
const userId = await dbService.insertUser({
  email: 'usuario@exemplo.com',
  name: 'Nome do Usuário',
  password_hash: 'hash_da_senha'
});
```

### Buscar notícias
```typescript
const noticias = await dbService.getAllNews();
console.log(\`Total: \${noticias.length} notícias\`);
```

### Fechar conexão
```typescript
await dbService.close();
```

## 📊 Estrutura do Banco

### Tabelas Principais:
- **news**: Notícias
- **users**: Usuários  
- **categories**: Categorias
- **_CategoryToNews**: Relacionamento many-to-many entre categorias e notícias

### Tipos TypeScript:
```typescript
interface NewsData {
  title: string;
  summary?: string;
  source?: string;
  content: string;
  categories?: string[];
}

interface UserData {
  id?: string;
  email: string;
  name: string;
  password_hash: string;
}

interface CategoryData {
  name: string;
}
```

## 🎯 Exemplo Completo

Veja o arquivo `src/exemplo_uso.ts` para um exemplo completo de como:
- Inserir múltiplas notícias
- Criar categorias
- Associar categorias às notícias
- Buscar e listar dados

## 🔍 Logs e Debugging

O serviço fornece logs detalhados:
- ✅ Conexões bem-sucedidas
- 📰 Notícias inseridas
- 🏷️ Categorias criadas/associadas
- 👤 Usuários criados
- ❌ Erros e falhas

## 🚨 Tratamento de Erros

- Todas as funções retornam `null` em caso de erro
- Erros são logados no console
- Transações são utilizadas para operações complexas
- Pool de conexões gerencia automaticamente as conexões