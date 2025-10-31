import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * DELETE /api/articles/delete-all
 * 모든 article 삭제 (개발 환경 전용)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 개발 환경에서만 허용
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    console.log('[API] Deleting all articles...');

    // 모든 article 삭제
    const { error, count } = await supabase
      .from('articles')
      .delete()
      .neq('id', ''); // 모든 행 선택 (id가 빈 문자열이 아닌 모든 행)

    if (error) {
      console.error('[API] Error deleting articles:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Deleted all articles (count: ${count})`);

    return NextResponse.json({
      success: true,
      message: 'All articles deleted successfully',
      count: count || 0,
    });
  } catch (error) {
    console.error('[API] Error deleting all articles:', error);
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
