'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

type Article = {
  id: string;
  title: string;
  title_ko: string | null;
  description: string;
  summary_ko: string | null;
  keywords: string[] | null;
  content_summary: string | null;
  source_url: string;
  published_at: string;
  platform: string;
  content_type: 'blog' | 'video';
  created_at: string;
};

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentSummary, setContentSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Article 데이터 로드
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load article');
        }

        setArticle(data.data);

        // 이미 저장된 AI 정리가 있으면 표시
        if (data.data.content_summary) {
          setContentSummary(data.data.content_summary);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error loading article:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  // AI 정리 생성
  const handleGenerateSummary = async () => {
    if (!article) return;

    setLoadingSummary(true);
    try {
      const response = await fetch(`/api/articles/${id}/summarize`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setContentSummary(data.data.content_summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error generating summary:', errorMessage);
      alert(`AI 정리 생성 실패: ${errorMessage}`);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-gray-600 mb-6">{error || 'Article not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const contentTypeIcon = article.content_type === 'blog' ? '📝' : '🎥';
  const relativeTime = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors mb-4"
          >
            ← 목록으로
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{contentTypeIcon}</span>
            <span className="text-sm text-blue-100">
              {article.content_type === 'blog' ? 'Blog' : 'Video'}
            </span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 제목 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {showTranslation ? article.title : (article.title_ko || article.title)}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <time dateTime={article.published_at}>{relativeTime}</time>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            {showTranslation ? '🇰🇷 한글로 보기' : '🇬🇧 원문으로 보기'}
          </button>
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            원문 보기 →
          </a>
          <button
            onClick={handleGenerateSummary}
            disabled={loadingSummary || !!contentSummary}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
          >
            {loadingSummary ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>AI 정리 중...</span>
              </>
            ) : contentSummary ? (
              <>✅ AI 정리 완료</>
            ) : (
              <>🤖 AI 정리</>
            )}
          </button>
        </div>

        {/* 요약 */}
        {article.summary_ko && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📋 간단 요약</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {article.summary_ko}
            </p>
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📄 {showTranslation ? '원문 설명' : '설명'}
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {article.description}
          </p>
        </div>

        {/* AI 상세 정리 */}
        {contentSummary && (
          <div className="bg-white rounded-lg shadow-sm p-8 border-2 border-green-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🤖 AI 상세 정리
            </h2>
            <div className="markdown-content">
              <ReactMarkdown>
                {contentSummary
                  .replace(/^```markdown\s*/i, '')  // 시작 부분의 ```markdown 제거
                  .replace(/\s*```\s*$/i, '')        // 끝 부분의 ``` 제거
                  .trim()
                }
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
