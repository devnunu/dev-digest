import { supabase } from './supabase';
import { Article, ArticleRow } from '@/types/article';

/**
 * articles 테이블 생성 SQL
 *
 * 아래 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요:
 * https://supabase.com/dashboard/project/YOUR_PROJECT/sql
 *
 * CREATE TABLE IF NOT EXISTS articles (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   source_url TEXT UNIQUE NOT NULL,
 *   published_at TIMESTAMP NOT NULL,
 *   platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web', 'backend')),
 *   content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'video')),
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * CREATE INDEX IF NOT EXISTS idx_articles_platform ON articles(platform);
 * CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
 */

/**
 * articles 테이블이 존재하는지 확인하는 함수
 */
export async function checkArticlesTable(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('articles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Articles table does not exist or is not accessible:', error.message);
      return false;
    }

    console.log('Articles table exists and is accessible');
    return true;
  } catch (error) {
    console.error('Error checking articles table:', error);
    return false;
  }
}

/**
 * 테이블 생성을 안내하는 함수
 * 실제 테이블 생성은 Supabase Dashboard에서 수행해야 함
 */
export async function createArticlesTable() {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Articles 테이블을 생성해야 합니다.

  1. Supabase Dashboard에 로그인하세요
  2. SQL Editor로 이동하세요
  3. 아래 SQL을 복사하여 실행하세요:

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT UNIQUE NOT NULL,
    published_at TIMESTAMP NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web', 'backend')),
    content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'video')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_articles_platform ON articles(platform);
  CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  const exists = await checkArticlesTable();
  if (!exists) {
    throw new Error(
      'Articles table does not exist. Please create it using the SQL above in Supabase Dashboard.'
    );
  }
}

/**
 * 기사를 데이터베이스에 삽입하는 함수
 * 중복된 source_url이 있으면 무시함
 */
export async function insertArticle(article: Omit<Article, 'created_at'>) {
  try {
    const { error } = await supabase
      .from('articles')
      .insert({
        id: article.id,
        title: article.title,
        description: article.description,
        source_url: article.source_url,
        published_at: article.published_at.toISOString(),
        platform: article.platform,
        content_type: article.content_type,
      })
      .select();

    // 중복 에러는 무시 (unique constraint violation)
    if (error) {
      if (error.code === '23505') {
        // Postgres unique violation code
        console.log(`Article already exists: ${article.title}`);
        return false;
      }
      throw error;
    }

    console.log(`Article inserted: ${article.title}`);
    return true;
  } catch (error) {
    console.error('Error inserting article:', error);
    return false;
  }
}

/**
 * 여러 기사를 한 번에 삽입하는 함수
 */
export async function insertArticles(articles: Omit<Article, 'created_at'>[]) {
  let successCount = 0;
  let skipCount = 0;

  for (const article of articles) {
    const result = await insertArticle(article);
    if (result) {
      successCount++;
    } else {
      skipCount++;
    }
  }

  console.log(`Inserted ${successCount} articles, skipped ${skipCount}`);
  return { successCount, skipCount };
}

/**
 * 플랫폼과 날짜 범위로 기사를 조회하는 함수
 */
export async function getArticles(
  platform?: string,
  days: number = 7
): Promise<Article[]> {
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    let query = supabase
      .from('articles')
      .select('*')
      .gte('published_at', daysAgo.toISOString())
      .order('published_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 문자열 날짜를 Date 객체로 변환
    const articles: Article[] = (data || []).map((row: any) => ({
      ...row,
      published_at: new Date(row.published_at),
      created_at: new Date(row.created_at),
    }));

    console.log(`Retrieved ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('Error getting articles:', error);
    throw error;
  }
}

/**
 * source_url로 기사가 이미 존재하는지 확인하는 함수
 */
export async function articleExists(sourceUrl: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id')
      .eq('source_url', sourceUrl)
      .limit(1);

    if (error) {
      console.error('Error checking article existence:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking article existence:', error);
    return false;
  }
}
