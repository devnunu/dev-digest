import Parser from 'rss-parser';
import { Article } from '@/types/article';
import { insertArticles, createArticlesTable, articleExists } from './db';
import { summarizeContent } from './openai';
import { fetchYouTubeVideos } from './youtube';
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
    {
      url: 'https://androidweekly.net/rss',
      platform: 'android' as const,
      contentType: 'blog' as const,
    },
    {
      url: 'https://medium.com/feed/tag/android',
      platform: 'android' as const,
      contentType: 'blog' as const,
    },
    {
      url: 'https://proandroiddev.com/feed',
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
      title_ko: null, // 초기값은 null, 나중에 번역
      description: item.contentSnippet || item.content || item.summary || '',
      summary_ko: null, // 초기값은 null, 나중에 요약 생성
      keywords: null, // 초기값은 null, 나중에 키워드 생성
      content_summary: null, // 초기값은 null, 사용자가 요청 시 생성
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
 * 특정 플랫폼의 모든 RSS 피드를 파싱하고 요약을 생성하는 함수
 */
export async function fetchAndStoreArticles(
  platform: 'android' | 'ios' | 'web' | 'backend' = 'android'
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

    // 모든 피드를 파싱
    const allArticles: Omit<Article, 'created_at'>[] = [];

    for (const feed of feeds) {
      const articles = await parseFeed(
        feed.url,
        feed.platform,
        feed.contentType
      );
      allArticles.push(...articles);
    }

    // YouTube 비디오 가져오기 (Android 플랫폼인 경우만)
    if (platform === 'android') {
      try {
        console.log('[RSS] Fetching YouTube videos...');
        const youtubeVideos = await fetchYouTubeVideos();
        allArticles.push(...youtubeVideos);
        console.log(`[RSS] Added ${youtubeVideos.length} YouTube videos`);
      } catch (error) {
        console.error('[RSS] Failed to fetch YouTube videos:', error);
        // YouTube 실패해도 계속 진행
      }
    }

    console.log(`Total articles fetched: ${allArticles.length}`);

    // 중복 체크 및 새 글만 필터링
    const newArticles: Omit<Article, 'created_at'>[] = [];
    console.log('Checking for duplicate articles...');

    for (const article of allArticles) {
      const exists = await articleExists(article.source_url);
      if (!exists) {
        newArticles.push(article);
      }
    }

    console.log(`Found ${newArticles.length} new articles (${allArticles.length - newArticles.length} duplicates)`);

    // 새 글이 있으면 요약 생성
    if (newArticles.length > 0) {
      console.log(`Generating summaries for ${newArticles.length} new articles...`);

      // 병렬로 요약 생성 (동시 요청 수 제한: 3)
      const BATCH_SIZE = 3;
      let summarizedCount = 0;
      let totalTokens = 0;

      for (let i = 0; i < newArticles.length; i += BATCH_SIZE) {
        const batch = newArticles.slice(i, i + BATCH_SIZE);

        const summaryPromises = batch.map(async (article) => {
          try {
            const result = await summarizeContent(article.title, article.description);

            if (result) {
              article.title_ko = result.title_ko;
              article.summary_ko = result.summary;
              article.keywords = result.keywords;
              summarizedCount++;
              totalTokens += result.tokens;
              console.log(`[${summarizedCount}/${newArticles.length}] Summary generated: "${article.title_ko}" [${result.keywords.join(', ')}]`);
            } else {
              console.warn(`[${summarizedCount}/${newArticles.length}] Summary failed: "${article.title}"`);
            }
          } catch (error) {
            console.error(`Error summarizing article "${article.title}":`, error);
          }
        });

        await Promise.all(summaryPromises);

        // Rate limit 방지를 위한 딜레이 (마지막 배치 제외)
        if (i + BATCH_SIZE < newArticles.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Summaries generated: ${summarizedCount}/${newArticles.length} (${totalTokens} tokens used)`);

      // 데이터베이스에 저장
      const { successCount, skipCount } = await insertArticles(newArticles);
      console.log(
        `Stored ${successCount} new articles, ${skipCount} failed`
      );

      return {
        success: true,
        count: successCount,
      };
    } else {
      console.log('No new articles to process');
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
