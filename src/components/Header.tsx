'use client';

import React, { useState } from 'react';

export default function Header() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleFetchRSS = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cron/fetch');
      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ ${data.count}개의 새 콘텐츠가 수집되었습니다!`,
        });

        // 새 콘텐츠가 있으면 1.5초 후 페이지 새로고침
        if (data.count > 0) {
          setTimeout(() => window.location.reload(), 1500);
        } else {
          // 새 콘텐츠가 없으면 5초 후 메시지 제거
          setTimeout(() => setMessage(null), 5000);
        }
      } else {
        setMessage({
          type: 'error',
          text: `❌ 오류: ${data.error}`,
        });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ RSS 수집 중 오류가 발생했습니다.',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      '⚠️ 모든 콘텐츠를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/articles/delete-all', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ 모든 콘텐츠가 삭제되었습니다!`,
        });
        // 페이지 새로고침
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({
          type: 'error',
          text: `❌ 오류: ${data.error}`,
        });
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ 삭제 중 오류가 발생했습니다.',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              DevDigest
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              개발 트렌드를 한눈에
            </p>
          </div>

          {/* 개발 환경 전용: RSS 수집 & 삭제 버튼 */}
          {isDevelopment && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleFetchRSS}
                  disabled={isLoading || isDeleting}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>수집 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>RSS 수집</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeleteAll}
                  disabled={isLoading || isDeleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>삭제 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>전체 삭제</span>
                    </>
                  )}
                </button>
              </div>

              {/* 결과 메시지 */}
              {message && (
                <div
                  className={`px-3 py-1 rounded-md text-xs font-medium ${
                    message.type === 'success'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 플랫폼 탭 (나중에 추가 예정) */}
        <nav className="mt-6">
          <ul className="flex gap-2">
            <li>
              <button
                className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium shadow-sm"
                aria-current="page"
              >
                Android
              </button>
            </li>
            {/* 추후 추가될 플랫폼들 */}
            {/* <li>
              <button className="px-4 py-2 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg font-medium transition-colors">
                iOS
              </button>
            </li> */}
          </ul>
        </nav>
      </div>
    </header>
  );
}
