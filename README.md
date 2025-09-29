# 📰 Newsletter Agent - Sistema de Curadoria Inteligente

Sistema automatizado de curadoria de notícias com IA que processa fontes de dados JSON, aplica filtros de qualidade e gera resumos inteligentes antes de inserir no banco de dados.

## 🧠 Regras de Negócio

### 📋 Processo de Curadoria
O sistema implementa um pipeline inteligente de processamento de notícias:

1. **📁 Carregamento**: Lê notícias de arquivo JSON configurável
2. **🎯 Curadoria**: Aplica filtros de qualidade baseados em:
   - **Score de Relevância**: 0.0 a 1.0 (configurável via `RELEVANCE_SCORE_THRESHOLD`)
   - **Idioma**: Apenas `ptBR` e `EN` são aceitos
3. **📝 Resumo Inteligente**: Para conteúdos > 200 caracteres, gera resumo via Gemini AI
4. **💾 Persistência**: Salva no Banco de dados com conteúdo original + resumo

### 📊 Formato do JSON de Entrada
```json
{
  "news": [
    {
      "title": "Título da Notícia",
      "source": "Fonte da Notícia",
      "content": "Conteúdo completo da notícia...",
      "categories": ["tech", "ai", "health"],
      "relevanceScore": 0.8,
      "language": "ptBR"
    }
  ]
}
```

### ⚙️ Configurações via Environment
- `RELEVANCE_SCORE_THRESHOLD`: Score mínimo para aprovação (padrão: 0.7)
- `SUMMARY_MAX_LENGTH`: Tamanho máximo do resumo gerado (padrão: 180)
- `SOURCE_DATA_PATH`: Caminho para o arquivo JSON de entrada

## 🚀 Instalação e Configuração

### 1. Pré-requisitos
- Node.js 18+
- PostgreSQL (via Docker Compose do backend)
- Chave da API do Google Gemini

### 2. Instalação
```bash
# Clonar repositório
git clone <repo-url>
cd newsletter_agent

# Instalar dependências
npm install
```

### 3. Configuração do Ambiente
Copie o arquivo `.env.example` da raiz do projeto para `.env` e configure:

```env
# Node environment
NODE_ENV=dev | prod

# Database configuration (conecta com docker-compose do backend)
DATABASE_URL=postgresql://newsletter:newsletter123@localhost:5432/newsletter_db
PGHOST=localhost
PGPORT=5432
PGUSER=newsletter
PGPASSWORD=newsletter123
PGDATABASE=newsletter_db

# Gemini AI configuration
GEMINI_API_KEY=sua_chave_aqui  # Obtenha em: https://ai.google.dev/
GEMINI_MODEL=models/gemini-2.5-flash

# News curation configuration
RELEVANCE_SCORE_THRESHOLD=0.7    # Score mínimo (0-1)
SUMMARY_MAX_LENGTH=180           # Tamanho máximo do resumo

# Data source configuration
SOURCE_DATA_PATH=./src/data/source-data.json  # Caminho do JSON
```

### 4. Execução
```bash
# Executar processamento
npm run app

# Modo desenvolvimento (com watch)
npm run dev
```

## 🔄 Fluxo de Processamento

```mermaid
graph TD
    A[📁 JSON Source] --> B[📥 Load News]
    B --> C{🎯 Curação}
    C -->|Score < Threshold| D[❌ Rejeitada]
    C -->|Score >= Threshold| E{📏 Content > 200?}
    E -->|Não| F[✅ Aprovada]
    E -->|Sim| G[🤖 Gemini Summary]
    G --> H[✅ Aprovada + Summary]
    F --> I[💾 Database]
    H --> I
```

## 📊 Exemplo de Saída

```
🚀 === Newsletter Agent - Iniciando Aplicação ===

📁 Carregando notícias do arquivo: source-data.json...
✅ 10 notícias carregadas do arquivo

🎯 Iniciando curadoria de 10 notícias (threshold: 0.7)...
❌ Rejeitada: "Notícia X" - Score insuficiente (0.5 < 0.7)
📝 Notícia aprovada com conteúdo longo (506 chars), gerando resumo...
✅ Summary adicionado: 133 caracteres
✅ Aprovada: "Notícia Y" (Score: 0.8, Content: 506 chars, Summary: 133 chars)

📊 === Relatório Final ===
📁 Total carregado: 10
✅ Total aprovado: 5
❌ Total rejeitado: 5
💾 Inseridas no banco: 5
```

## 🏗️ Arquitetura

### Use Cases
- **LoadNewsFromSource**: Carrega notícias do JSON
- **CurateNews**: Aplica filtros de qualidade + geração de resumos
- **GenerateSummary**: Integração com Gemini AI

### Repositories
- **JsonNewsDataRepository**: Leitura de dados JSON
- **DBRepository**: Operações no Banco de Dados
- **GoogleLlmRepository**: Integração com Gemini AI

### Entities
```typescript
interface News {
  title: string;
  content: string;
  source: string;
  categories: string[];
  summary?: string;        // Gerado pela IA
  relevanceScore: number;  // 0.0 - 1.0
  language: string;        // 'ptBR' | 'EN'
}
```

## 🔧 Scripts Disponíveis

```bash
# Executar processamento completo
npm run app

# Modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🌐 Integração com o Projeto

Este agente faz parte do ecossistema do Newsletter:
- **Backend**: API REST Node + Vite + Prisma + PostgreSQL
- **Frontend**: REACT + Vite
- **Agent**: Este sistema de curadoria inteligente

## 🚀 Roadmap e Melhorias Futuras

### 📨 Sistema de Mensageria
- **Queue System**: Implementar RabbitMQ para processamento assíncrono
- **Event Sourcing**: Rastrear todas as operações de curadoria
- **Webhooks**: Notificar sistemas externos sobre novas notícias aprovadas
- **Scheduler**: Executar curadoria em intervalos configuráveis

### 🧪 Testes e Qualidade
- **Testes Unitários**: Cobertura completa dos use cases e repositories
- **Testes E2E**: Fluxo completo de curadoria com dados reais
- **Testes de Carga**: Validar performance com grandes volumes
- **CI/CD Pipeline**: Automatizar deploy com GitHub Actions

### 🛡️ Controle de Fontes
- **Blacklist/Whitelist**: Sistema configurável de fontes permitidas/bloqueadas
  - Rejeição automática de URLs específicas
  - Validação manual para fontes suspeitas
  - Configuração via banco de dados ou arquivo
- **Source Reputation**: Score de confiabilidade por fonte
- **Domain Validation**: Verificação de domínios conhecidos

### 📡 Múltiplas Fontes de Dados
- **RSS Feeds**: Integração com feeds de veículos de comunicação
- **News APIs**: Conectores para NewsAPI, Guardian, Reuters
- **Web Scraping**: Extração inteligente de sites de notícias
- **Social Media**: Monitoramento de tendências no Twitter/LinkedIn
- **Manual Input**: Interface para inserção manual de notícias

### 🤖 IA e Machine Learning
- **Sentiment Analysis**: Análise de sentimento das notícias
- **Topic Modeling**: Classificação automática de categorias
- **Duplicate Detection**: Identificar notícias duplicadas
- **Trend Analysis**: Detectar tópicos em alta
- **Custom Models**: Treinar modelos específicos para o domínio

### 📊 Monitoramento e Analytics
- **Dashboard**: Métricas de curadoria em tempo real
- **Alertas**: Notificações para falhas ou anomalias
- **Performance Tracking**: Monitorar latência e throughput
- **A/B Testing**: Testar diferentes estratégias de curadoria

### 🔧 Infraestrutura
- **Containerização**: Docker para ambientes consistentes
- **Kubernetes**: Orquestração para alta disponibilidade
- **CDN**: Cache de conteúdo para melhor performance
- **Database Sharding**: Escalabilidade horizontal do banco