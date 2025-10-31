import React from 'react';
import ArticleCard from './ArticleCard';
import Pagination from './Pagination';

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
  is_bookmarked?: boolean;
};

type ArticleListProps = {
  articles: Article[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  readArticles: Set<string>;
  onRead: (articleId: string) => void;
  onBookmark: (articleId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

// Skeleton 카드 컴포넌트
function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </div>
      <div className="w-full h-6 bg-gray-200 rounded mb-3"></div>
      <div className="w-3/4 h-6 bg-gray-200 rounded mb-3"></div>
      <div className="space-y-2 mb-4">
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
      </div>
      <div className="w-20 h-4 bg-gray-200 rounded"></div>
    </div>
  );
}

// 빈 상태 컴포넌트
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        아직 콘텐츠가 없습니다
      </h3>
      <p className="text-gray-600 text-center max-w-md">
        선택한 기간과 필터에 해당하는 콘텐츠가 없습니다.
        <br />
        다른 조건으로 검색해보세요.
      </p>
    </div>
  );
}

// 에러 상태 컴포넌트
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        오류가 발생했습니다
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export default function ArticleList({
  articles,
  loading,
  error,
  onRetry,
  readArticles,
  onRead,
  onBookmark,
  currentPage,
  totalPages,
  onPageChange,
}: ArticleListProps) {
  // 로딩 상태
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  // 빈 상태
  if (articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState />
      </div>
    );
  }

  // 정상 상태: 기사 목록 표시
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isRead={readArticles.has(article.id)}
            onRead={onRead}
            onBookmark={onBookmark}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
