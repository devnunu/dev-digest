import { NextResponse } from 'next/server';
import { fetchAndStoreArticles } from '@/lib/rss';

/**
 * POST /api/rss/fetch
 *
 * RSS 피드를 파싱하고 데이터베이스에 저장하는 엔드포인트
 *
 * 요청 본문 (optional):
 * - platform: 'android' | 'ios' | 'web' | 'backend' (기본값: 'android')
 *
 * 응답:
 * - success: boolean
 * - count: number (새로 저장된 기사 수)
 * - error: string | null
 */
export async function POST(request: Request) {
  try {
    let platform: 'android' | 'ios' | 'web' | 'backend' = 'android';

    // 요청 본문이 있으면 파싱
    try {
      const body = await request.json();
      if (body.platform) {
        const validPlatforms = ['android', 'ios', 'web', 'backend'];
        if (!validPlatforms.includes(body.platform)) {
          return NextResponse.json(
            {
              success: false,
              count: 0,
              error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
            },
            { status: 400 }
          );
        }
        platform = body.platform;
      }
    } catch {
      // 요청 본문이 없거나 파싱 실패 시 기본값 사용
      console.log('No request body, using default platform: android');
    }

    console.log(`Starting RSS fetch for platform: ${platform}`);

    // RSS 피드를 파싱하고 데이터베이스에 저장
    const result = await fetchAndStoreArticles(platform);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          count: 0,
          error: result.error || 'Failed to fetch and store articles',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: result.count,
        error: null,
        message: `Successfully fetched and stored ${result.count} new articles`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/rss/fetch:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        count: 0,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
