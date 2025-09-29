export interface News {
  title: string;
  content: string;
  source: string;
  categories: string[];
  /** 
   * AI-generated summary of the content (optional)
   * Generated automatically for approved news with content > 200 characters
   */
  summary?: string;
  /** 
   * Relevance score ranging from 0 to 1
   * 0 = Not relevant
   * 0.1-0.3 = Low relevance  
   * 0.4-0.6 = Medium relevance
   * 0.7-0.9 = High relevance
   * 1.0 = Maximum relevance
   */
  relevanceScore: number;
  /** 
   * Language code using standard abbreviations
   * Examples: "ptBR" (Portuguese Brazil), "EN" (English), "ES" (Spanish), "FR" (French)
   */
  language: string;
}