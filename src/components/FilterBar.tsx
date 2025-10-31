'use client';

import React from 'react';

type FilterBarProps = {
  days: number;
  contentType: 'all' | 'blog' | 'video';
  showBookmarked: boolean;
  onDaysChange: (days: number) => void;
  onContentTypeChange: (type: 'all' | 'blog' | 'video') => void;
  onShowBookmarkedChange: (show: boolean) => void;
};

export default function FilterBar({
  days,
  contentType,
  showBookmarked,
  onDaysChange,
  onContentTypeChange,
  onShowBookmarkedChange,
}: FilterBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          {/* 기간 선택 */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="days-filter"
              className="text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              기간
            </label>
            <select
              id="days-filter"
              value={days}
              onChange={(e) => onDaysChange(Number(e.target.value))}
              className="block w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value={7}>최근 7일</option>
              <option value={14}>최근 14일</option>
              <option value={30}>최근 30일</option>
            </select>
          </div>

          {/* 콘텐츠 타입 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onContentTypeChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                contentType === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => onContentTypeChange('blog')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                contentType === 'blog'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 블로그
            </button>
            <button
              onClick={() => onContentTypeChange('video')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                contentType === 'video'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎥 영상
            </button>

            {/* 구분선 */}
            <div className="h-8 w-px bg-gray-300 hidden sm:block"></div>

            {/* 북마크 필터 */}
            <button
              onClick={() => onShowBookmarkedChange(!showBookmarked)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showBookmarked
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⭐ 북마크
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
