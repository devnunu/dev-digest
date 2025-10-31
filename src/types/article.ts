/**
 * Article 타입 정의
 * DevDigest 서비스에서 사용하는 기사 데이터 구조
 */
export type Article = {
  id: string;
  title: string;
  description: string;
  source_url: string;
  published_at: Date;
  platform: 'android' | 'ios' | 'web' | 'backend';
  content_type: 'blog' | 'video';
  created_at: Date;
};

/**
 * 데이터베이스에서 반환되는 Article 타입 (날짜가 문자열)
 */
export type ArticleRow = Omit<Article, 'published_at' | 'created_at'> & {
  published_at: string;
  created_at: string;
};
