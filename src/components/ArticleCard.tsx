import React from 'react';
import { formatDistanceToNow, isWithinInterval, subHours } from 'date-fns';
import { ko } from 'date-fns/locale';

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

type ArticleCardProps = {
  article: Article;
  isRead?: boolean;
  onBookmark?: (articleId: string) => void;
  onRead?: (articleId: string) => void;
};

// RSS 피드 URL에서 출처 이름 추출
function getSourceName(url: string): string {
  if (url.includes('android-developers.googleblog.com')) {
    return 'Android Developers Blog';
  }
  if (url.includes('blog.jetbrains.com/kotlin')) {
    return 'Kotlin Blog';
  }
  if (url.includes('androidweekly.net')) {
    return 'Android Weekly';
  }
  if (url.includes('medium.com')) {
    return 'Medium';
  }
  if (url.includes('proandroiddev.com')) {
    return 'ProAndroidDev';
  }
  if (url.includes('youtube.com')) {
    return 'YouTube';
  }
  // 기본값: 도메인 추출
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown Source';
  }
}

export default function ArticleCard({ article, isRead = false, onBookmark, onRead }: ArticleCardProps) {
  const contentTypeIcon = article.content_type === 'blog' ? '📝' : '🎥';
  const sourceName = getSourceName(article.source_url);

  // 상대 시간 계산
  const relativeTime = formatDistanceToNow(new Date(article.published_at), {
    addSuffix: true,
    locale: ko,
  });

  // NEW 배지 표시 여부 (24시간 이내 생성된 글)
  const isNew = isWithinInterval(new Date(article.created_at), {
    start: subHours(new Date(), 24),
    end: new Date(),
  });

  // 제목과 요약에서 라벨 제거 (기존 데이터 대응)
  const cleanTitle = (article.title_ko || article.title).replace(/^(제목|Title):\s*/i, '').trim();
  const cleanSummary = (article.summary_ko || article.description).replace(/^(요약|Summary):\s*/i, '').trim();

  // 북마크 토글 핸들러
  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(article.id);
    }
  };

  // 읽음 처리 핸들러
  const handleClick = () => {
    if (onRead && !isRead) {
      onRead(article.id);
    }
  };

  return (
    <article className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 border border-gray-200 relative ${isRead ? 'opacity-60' : ''}`}>
      <a
        href={`/article/${article.id}`}
        onClick={(e) => {
          handleClick();
        }}
        className="block p-6 h-full cursor-pointer"
      >
        {/* NEW 배지 */}
        {isNew && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            NEW
          </div>
        )}

        {/* 헤더: 콘텐츠 타입 + 출처 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg" aria-label={article.content_type}>
            {contentTypeIcon}
          </span>
          <span className="text-sm text-gray-600 font-medium">
            {article.content_type === 'blog' ? 'Blog' : 'Video'} · {sourceName}
          </span>
        </div>

        {/* 제목 (한글 우선, 없으면 원문) */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {cleanTitle}
        </h2>

        {/* 요약 (summary_ko 우선, 없으면 description) */}
        <p className="text-gray-700 leading-relaxed line-clamp-3 mb-3">
          {cleanSummary}
        </p>

        {/* 키워드 태그 */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {article.keywords.slice(0, 4).map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
              >
                #{keyword}
              </span>
            ))}
          </div>
        )}

        {/* 하단: 시간 + 북마크 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <time dateTime={article.published_at}>{relativeTime}</time>
          <button
            onClick={handleBookmark}
            className="text-2xl hover:scale-110 transition-transform z-10"
            aria-label={article.is_bookmarked ? '북마크 해제' : '북마크 추가'}
          >
            {article.is_bookmarked ? '⭐' : '☆'}
          </button>
        </div>
      </a>
    </article>
  );
}
