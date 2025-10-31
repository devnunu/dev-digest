import Parser from 'rss-parser';
import { Article } from '@/types/article';
import { insertArticles, createArticlesTable } from './db';
import { createHash } from 'crypto';

// RSS 파서 인스턴스 생성
const parser = new Parser();

/**
 * RSS 피드 소스 정의
 */
const RSS_FEEDS = {
  android: [
    {
      url: 'https://android-developers.googleblog.com/feeds/posts/default',
      platform: 'android' as const,
      contentType: 'blog' as const,
    },
    {
      url: 'https://blog.jetbrains.com/kotlin/feed/',
      platform: 'android' as const,
      contentType: 'blog' as const,
    },
  ],
} as const;

/**
 * 문자열을 기반으로 고유 ID 생성
 */
function generateId(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

/**
 * RSS 피드 아이템을 Article 타입으로 변환
 */
function convertToArticle(
  item: Parser.Item,
  platform: 'android' | 'ios' | 'web' | 'backend',
  contentType: 'blog' | 'video'
): Omit<Article, 'created_at'> | null {
  try {
    // 필수 필드 검증
    if (!item.link || !item.title) {
      console.warn('Missing required fields in RSS item:', item);
      return null;
    }

    // 발행일 파싱
    let publishedAt: Date;
    if (item.pubDate) {
      publishedAt = new Date(item.pubDate);
    } else if (item.isoDate) {
      publishedAt = new Date(item.isoDate);
    } else {
      publishedAt = new Date();
    }

    // 유효한 날짜인지 확인
    if (isNaN(publishedAt.getTime())) {
      console.warn('Invalid date in RSS item:', item);
      publishedAt = new Date();
    }

    return {
      id: generateId(item.link),
      title: item.title.trim(),
      description: item.contentSnippet || item.content || item.summary || '',
      source_url: item.link,
      published_at: publishedAt,
      platform,
      content_type: contentType,
    };
  } catch (error) {
    console.error('Error converting RSS item to article:', error);
    return null;
  }
}

/**
 * 단일 RSS 피드를 파싱하는 함수
 */
async function parseFeed(
  feedUrl: string,
  platform: 'android' | 'ios' | 'web' | 'backend',
  contentType: 'blog' | 'video'
): Promise<Omit<Article, 'created_at'>[]> {
  try {
    console.log(`Parsing RSS feed: ${feedUrl}`);

    const feed = await parser.parseURL(feedUrl);
    console.log(`Found ${feed.items.length} items in feed`);

    const articles: Omit<Article, 'created_at'>[] = [];

    for (const item of feed.items) {
      const article = convertToArticle(item, platform, contentType);
      if (article) {
        articles.push(article);
      }
    }

    console.log(`Converted ${articles.length} articles from ${feedUrl}`);
    return articles;
  } catch (error) {
    console.error(`Error parsing feed ${feedUrl}:`, error);
    return [];
  }
}

/**
 * 특정 플랫폼의 모든 RSS 피드를 파싱하는 함수
 */
export async function fetchAndStoreArticles(
  platform: keyof typeof RSS_FEEDS = 'android'
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log(`Starting to fetch articles for platform: ${platform}`);

    // 테이블이 없으면 생성
    await createArticlesTable();

    const feeds = RSS_FEEDS[platform];
    if (!feeds || feeds.length === 0) {
      return {
        success: false,
        count: 0,
        error: `No RSS feeds configured for platform: ${platform}`,
      };
    }

    // 모든 피드를 병렬로 파싱
    const allArticles: Omit<Article, 'created_at'>[] = [];

    for (const feed of feeds) {
      const articles = await parseFeed(
        feed.url,
        feed.platform,
        feed.contentType
      );
      allArticles.push(...articles);
    }

    console.log(`Total articles fetched: ${allArticles.length}`);

    // 데이터베이스에 저장
    if (allArticles.length > 0) {
      const { successCount, skipCount } = await insertArticles(allArticles);
      console.log(
        `Stored ${successCount} new articles, ${skipCount} duplicates skipped`
      );

      return {
        success: true,
        count: successCount,
      };
    } else {
      return {
        success: true,
        count: 0,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetchAndStoreArticles:', errorMessage);

    return {
      success: false,
      count: 0,
      error: errorMessage,
    };
  }
}

/**
 * 모든 플랫폼의 RSS 피드를 파싱하는 함수
 */
export async function fetchAllPlatforms(): Promise<{
  success: boolean;
  results: Record<string, { count: number; error?: string }>;
}> {
  const results: Record<string, { count: number; error?: string }> = {};

  for (const platform of Object.keys(RSS_FEEDS) as Array<
    keyof typeof RSS_FEEDS
  >) {
    const result = await fetchAndStoreArticles(platform);
    results[platform] = {
      count: result.count,
      error: result.error,
    };
  }

  const hasErrors = Object.values(results).some(r => r.error);

  return {
    success: !hasErrors,
    results,
  };
}
