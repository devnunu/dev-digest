/**
 * Article 타입 정의
 * DevDigest 서비스에서 사용하는 기사 데이터 구조
 */
export type Article = {
  id: string;
  title: string;
  title_ko: string | null;
  description: string;
  summary_ko: string | null;
  keywords: string[] | null;
  content_summary: string | null;
  source_url: string;
  published_at: Date;
  platform: 'android' | 'ios' | 'web' | 'backend';
  content_type: 'blog' | 'video';
  created_at: Date;
  is_bookmarked?: boolean;
};

/**
 * 데이터베이스에서 반환되는 Article 타입 (날짜가 문자열)
 */
export type ArticleRow = Omit<Article, 'published_at' | 'created_at'> & {
  published_at: string;
  created_at: string;
};

/**
 * 상세 페이지용 Article 타입 (추가 필드)
 */
export type ArticleDetail = Article & {
  content_summary?: string | null; // AI가 생성한 상세 정리
};
