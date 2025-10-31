import { NextRequest, NextResponse } from 'next/server';
import { fetchAndStoreArticles } from '@/lib/rss';

/**
 * GET /api/cron/fetch
 *
 * Vercel Cron Job에서 호출되는 엔드포인트
 * 매일 자동으로 RSS 피드를 파싱하고 새 콘텐츠를 수집합니다.
 *
 * 보안: CRON_SECRET 환경변수로 인증
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 인증 확인 (개발 환경에서는 스킵)
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      const authHeader = request.headers.get('authorization');
      const cronSecret = process.env.CRON_SECRET;

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron] Starting scheduled RSS fetch...');
    const startTime = Date.now();

    // Android 플랫폼 RSS 수집
    const result = await fetchAndStoreArticles('android');

    const elapsedTime = Date.now() - startTime;

    if (result.success) {
      console.log(
        `[Cron] RSS fetch completed successfully: ${result.count} new articles (${elapsedTime}ms)`
      );

      return NextResponse.json({
        success: true,
        count: result.count,
        elapsedTime,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('[Cron] RSS fetch failed:', result.error);

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          elapsedTime,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Cron] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
