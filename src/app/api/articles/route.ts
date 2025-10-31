import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@/lib/db';

/**
 * GET /api/articles
 *
 * 쿼리 파라미터:
 * - platform: 플랫폼 필터 (android, ios, web, backend) - optional
 * - days: 최근 N일간 데이터 (기본값: 7) - optional
 * - content_type: 콘텐츠 타입 필터 (blog, video) - optional
 * - page: 페이지 번호 (기본값: 1) - optional
 * - limit: 페이지당 항목 수 (기본값: 12) - optional
 *
 * 응답:
 * - success: boolean
 * - data: Article[] | null
 * - error: string | null
 * - count: number (현재 페이지 항목 수)
 * - total: number (전체 항목 수)
 * - page: number (현재 페이지)
 * - totalPages: number (전체 페이지 수)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const daysParam = searchParams.get('days');
    const contentType = searchParams.get('content_type');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

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
            total: 0,
            page: 1,
            totalPages: 0,
          },
          { status: 400 }
        );
      }
      days = parsedDays;
    }

    // page 파라미터 검증 및 파싱
    let page = 1; // 기본값
    if (pageParam) {
      const parsedPage = parseInt(pageParam, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: 'Invalid page parameter. Must be a positive number.',
            count: 0,
            total: 0,
            page: 1,
            totalPages: 0,
          },
          { status: 400 }
        );
      }
      page = parsedPage;
    }

    // limit 파라미터 검증 및 파싱
    let limit = 12; // 기본값
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: 'Invalid limit parameter. Must be between 1 and 100.',
            count: 0,
            total: 0,
            page: 1,
            totalPages: 0,
          },
          { status: 400 }
        );
      }
      limit = parsedLimit;
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

    // content_type 파라미터 검증
    if (contentType) {
      const validContentTypes = ['blog', 'video'];
      if (!validContentTypes.includes(contentType)) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: `Invalid content_type parameter. Must be one of: ${validContentTypes.join(', ')}`,
            count: 0,
          },
          { status: 400 }
        );
      }
    }

    console.log(
      `Fetching articles - platform: ${platform || 'all'}, days: ${days}, content_type: ${contentType || 'all'}, page: ${page}, limit: ${limit}`
    );

    // 데이터베이스에서 모든 기사 조회
    let allArticles = await getArticles(platform || undefined, days);

    // content_type 필터링
    if (contentType) {
      allArticles = allArticles.filter(
        (article) => article.content_type === contentType
      );
    }

    // 전체 개수
    const total = allArticles.length;

    // 페이지네이션 적용
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = allArticles.slice(startIndex, endIndex);

    // 전체 페이지 수 계산
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: paginatedArticles,
        error: null,
        count: paginatedArticles.length,
        total: total,
        page: page,
        totalPages: totalPages,
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
