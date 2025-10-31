-- Migration: Add summary_ko column to articles table
-- Date: 2025-10-31
-- Description: AI 요약 기능을 위한 한국어 요약 컬럼 추가

-- summary_ko 컬럼 추가
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS summary_ko TEXT;

-- 인덱스 추가 (요약이 있는 글 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_articles_has_summary
ON articles(summary_ko) WHERE summary_ko IS NOT NULL;

-- 확인
COMMENT ON COLUMN articles.summary_ko IS 'AI가 생성한 한국어 요약 (3-5줄)';
