'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import ArticleList from '@/components/ArticleList';

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

export default function Home() {
  // 상태 관리
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [days, setDays] = useState(7);
  const [contentType, setContentType] = useState<'all' | 'blog' | 'video'>('all');
  const [showBookmarked, setShowBookmarked] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 읽은 글 & 북마크 상태 (localStorage)
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());

  // localStorage에서 읽은 글 & 북마크 로드
  useEffect(() => {
    const savedReadArticles = localStorage.getItem('devdigest_read_articles');
    const savedBookmarkedArticles = localStorage.getItem('devdigest_bookmarked_articles');

    if (savedReadArticles) {
      setReadArticles(new Set(JSON.parse(savedReadArticles)));
    }

    if (savedBookmarkedArticles) {
      setBookmarkedArticles(new Set(JSON.parse(savedBookmarkedArticles)));
    }
  }, []);

  // 기사 데이터 로드
  const fetchArticles = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      // API URL 구성
      const params = new URLSearchParams({
        platform: 'android',
        days: days.toString(),
        page: page.toString(),
        limit: '12',
      });

      // content_type 필터 추가 (전체가 아닌 경우만)
      if (contentType !== 'all') {
        params.append('content_type', contentType);
      }

      const response = await fetch(`/api/articles?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load articles');
      }

      setArticles(data.data || []);
      setCurrentPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading articles:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
    fetchArticles(1);
  }, [days, contentType]);

  // 읽음 처리 핸들러
  const handleRead = (articleId: string) => {
    const newReadArticles = new Set(readArticles);
    newReadArticles.add(articleId);
    setReadArticles(newReadArticles);
    localStorage.setItem('devdigest_read_articles', JSON.stringify([...newReadArticles]));
  };

  // 북마크 토글 핸들러
  const handleBookmark = (articleId: string) => {
    const newBookmarkedArticles = new Set(bookmarkedArticles);

    if (newBookmarkedArticles.has(articleId)) {
      newBookmarkedArticles.delete(articleId);
    } else {
      newBookmarkedArticles.add(articleId);
    }

    setBookmarkedArticles(newBookmarkedArticles);
    localStorage.setItem('devdigest_bookmarked_articles', JSON.stringify([...newBookmarkedArticles]));
  };

  // 재시도 핸들러
  const handleRetry = () => {
    fetchArticles(currentPage);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchArticles(page);
    // 페이지 변경 시 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 북마크 필터 적용
  const filteredArticles = showBookmarked
    ? articles.filter(article => bookmarkedArticles.has(article.id))
    : articles;

  // 북마크 정보를 articles에 추가
  const articlesWithBookmarks = filteredArticles.map(article => ({
    ...article,
    is_bookmarked: bookmarkedArticles.has(article.id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <FilterBar
        days={days}
        contentType={contentType}
        showBookmarked={showBookmarked}
        onDaysChange={setDays}
        onContentTypeChange={setContentType}
        onShowBookmarkedChange={setShowBookmarked}
      />
      <ArticleList
        articles={articlesWithBookmarks}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        readArticles={readArticles}
        onRead={handleRead}
        onBookmark={handleBookmark}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
