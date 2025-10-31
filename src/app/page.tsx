'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * RSS 피드를 파싱하고 데이터베이스에 저장
   */
  const handleFetchRSS = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Fetching RSS feeds...');

      const response = await fetch('/api/rss/fetch', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch RSS feeds');
      }

      console.log('RSS fetch result:', data);
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching RSS:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 저장된 기사 목록을 불러오기
   */
  const handleLoadArticles = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Loading articles...');

      const response = await fetch('/api/articles?platform=android&days=7');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load articles');
      }

      console.log('Articles loaded:', data);
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading articles:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">DevDigest</h1>

        <div className="mb-8 space-x-4">
          <button
            onClick={handleFetchRSS}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Test RSS Fetch'}
          </button>

          <button
            onClick={handleLoadArticles}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load Articles'}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <h3 className="font-bold mb-2">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-bold mb-4">사용 방법</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>
              <strong>Test RSS Fetch</strong>: RSS 피드를 파싱하고 데이터베이스에 저장합니다.
            </li>
            <li>
              <strong>Load Articles</strong>: 저장된 기사 목록을 불러옵니다. (최근 7일, Android 플랫폼)
            </li>
            <li>결과는 JSON 형식으로 화면에 표시됩니다.</li>
          </ol>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>주의:</strong> RSS Fetch를 실행하기 전에 환경변수(.env.local)에
              POSTGRES_URL을 설정해야 합니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
