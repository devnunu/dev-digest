import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@/lib/db';

/**
 * GET /api/articles
 *
 * 쿼리 파라미터:
 * - platform: 플랫폼 필터 (android, ios, web, backend) - optional
 * - days: 최근 N일간 데이터 (기본값: 7) - optional
 *
 * 응답:
 * - success: boolean
 * - data: Article[] | null
 * - error: string | null
 * - count: number
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const daysParam = searchParams.get('days');

    // days 파라미터 검증 및 파싱
    let days = 7; // 기본값
    if (daysParam) {
      const parsedDays = parseInt(daysParam, 10);
      if (isNaN(parsedDays) || parsedDays < 1) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: 'Invalid days parameter. Must be a positive number.',
            count: 0,
          },
          { status: 400 }
        );
      }
      days = parsedDays;
    }

    // platform 파라미터 검증
    if (platform) {
      const validPlatforms = ['android', 'ios', 'web', 'backend'];
      if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: `Invalid platform parameter. Must be one of: ${validPlatforms.join(', ')}`,
            count: 0,
          },
          { status: 400 }
        );
      }
    }

    console.log(`Fetching articles - platform: ${platform || 'all'}, days: ${days}`);

    // 데이터베이스에서 기사 조회
    const articles = await getArticles(platform || undefined, days);

    return NextResponse.json(
      {
        success: true,
        data: articles,
        error: null,
        count: articles.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/articles:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: errorMessage,
        count: 0,
      },
      { status: 500 }
    );
  }
}
