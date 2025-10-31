import { Article } from '@/types/article';
import { summarizeContent } from './openai';
import { createHash } from 'crypto';

/**
 * YouTube 채널 목록
 * 안드로이드 개발 관련 인기 채널
 */
const YOUTUBE_CHANNELS = [
  {
    channelId: 'UCKNTZMRHPLXfqlbdOI7mCkg', // Philipp Lackner
    name: 'Philipp Lackner',
    platform: 'android' as const,
  },
  {
    channelId: 'UC_Fh8kvtkVPkeihBs42jGcA', // Coding in Flow
    name: 'Coding in Flow',
    platform: 'android' as const,
  },
  {
    channelId: 'UCVysWoMPvvezb5fGJY8ADig', // Android Developers
    name: 'Android Developers',
    platform: 'android' as const,
  },
];

/**
 * 문자열을 기반으로 고유 ID 생성
 */
function generateId(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

/**
 * YouTube Data API v3를 사용하여 채널의 최신 영상 가져오기
 *
 * API 문서: https://developers.google.com/youtube/v3/docs/search/list
 */
async function fetchChannelVideos(
  channelId: string,
  channelName: string,
  maxResults: number = 10
): Promise<Array<{ videoId: string; title: string; description: string; publishedAt: string }>> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('[YouTube] API key not found');
    return [];
  }

  try {
    // YouTube Search API 호출
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('channelId', channelId);
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('order', 'date');
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('key', apiKey);

    console.log(`[YouTube] Fetching videos from ${channelName}...`);

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[YouTube] API error for ${channelName}:`, errorData);
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`[YouTube] No videos found for ${channelName}`);
      return [];
    }

    const videos = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
    }));

    console.log(`[YouTube] Found ${videos.length} videos from ${channelName}`);
    return videos;
  } catch (error) {
    console.error(`[YouTube] Error fetching videos from ${channelName}:`, error);
    return [];
  }
}

/**
 * YouTube 영상을 Article 타입으로 변환
 */
async function convertYouTubeToArticle(
  video: {
    videoId: string;
    title: string;
    description: string;
    publishedAt: string;
  },
  channelName: string,
  platform: 'android' | 'ios' | 'web' | 'backend'
): Promise<Omit<Article, 'created_at'> | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

    // AI 요약 및 번역 생성
    let title_ko: string | null = null;
    let summary: string | null = null;
    let keywords: string[] | null = null;
    try {
      const summaryResult = await summarizeContent(video.title, video.description);
      if (summaryResult) {
        title_ko = summaryResult.title_ko;
        summary = summaryResult.summary;
        keywords = summaryResult.keywords;
      }
    } catch (error) {
      console.error(`[YouTube] Failed to summarize video: ${video.title}`, error);
    }

    return {
      id: generateId(videoUrl),
      title: video.title,
      title_ko: title_ko,
      description: video.description || '',
      summary_ko: summary,
      keywords: keywords,
      content_summary: null, // 초기값은 null, 사용자가 요청 시 생성
      source_url: videoUrl,
      published_at: new Date(video.publishedAt),
      platform,
      content_type: 'video',
    };
  } catch (error) {
    console.error('[YouTube] Error converting video to article:', error);
    return null;
  }
}

/**
 * 모든 YouTube 채널에서 최신 영상을 가져와 Article로 변환
 */
export async function fetchYouTubeVideos(): Promise<Omit<Article, 'created_at'>[]> {
  console.log('[YouTube] Starting to fetch videos from all channels...');

  const allArticles: Omit<Article, 'created_at'>[] = [];

  for (const channel of YOUTUBE_CHANNELS) {
    try {
      const videos = await fetchChannelVideos(channel.channelId, channel.name, 5);

      // 각 영상을 Article로 변환
      for (const video of videos) {
        const article = await convertYouTubeToArticle(
          video,
          channel.name,
          channel.platform
        );

        if (article) {
          allArticles.push(article);
        }

        // Rate limit 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`[YouTube] Error processing channel ${channel.name}:`, error);
    }
  }

  console.log(`[YouTube] Total videos fetched: ${allArticles.length}`);
  return allArticles;
}
