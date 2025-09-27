import { News } from "../entities/news_entity";

export interface NewsModel {
  title: string;
  source?: string;
  summary?: string;
  content: string;
  published_at: Date;
}

export interface CategoryModel {
  id: number;
  name: string;
}

export interface NewsWithCategoriesModel extends NewsModel {
  categories: CategoryModel[];
}

export interface NewsRepository {
  insertNews(newsData: News): Promise<News | null>;
  insertCategory(categoryData: { name: string }): Promise<CategoryModel | null>;
  getAllNews(): Promise<NewsWithCategoriesModel[]>;
  getAllCategories(): Promise<CategoryModel[]>;
}