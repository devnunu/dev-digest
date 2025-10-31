import { NextRequest, NextResponse } from 'next/server';
import { getArticleById, updateArticleContentSummary } from '@/lib/db';
import { generateDetailedSummary } from '@/lib/openai';

/**
 * POST /api/articles/[id]/summarize
 * Article의 상세 정리 생성 및 저장
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Article 조회
    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // 이미 정리가 있으면 저장된 내용 반환
    if (article.content_summary) {
      console.log(`[API] Returning cached summary for article: ${article.id}`);
      return NextResponse.json({
        success: true,
        data: {
          content_summary: article.content_summary,
          tokens: 0, // 캐시된 데이터이므로 토큰 사용 없음
          cached: true,
        },
      });
    }

    // AI 상세 정리 생성
    console.log(`[API] Generating detailed summary for article: ${article.id}`);
    const result = await generateDetailedSummary(article.title, article.description);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // DB에 저장
    const updated = await updateArticleContentSummary(id, result.content_summary);

    if (!updated) {
      console.warn(`[API] Failed to save summary to DB for article: ${article.id}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        content_summary: result.content_summary,
        tokens: result.tokens,
        cached: false,
      },
    });
  } catch (error) {
    console.error('[API] Error generating summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
