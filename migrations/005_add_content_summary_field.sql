-- Migration: Add content_summary field to articles table
-- Date: 2025-10-31
-- Description: AI가 생성한 상세 정리 필드 추가 (캐싱용)

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS content_summary TEXT;

-- 인덱스 추가 (정리 여부 확인용)
CREATE INDEX IF NOT EXISTS idx_articles_has_content_summary ON articles(content_summary) WHERE content_summary IS NOT NULL;

-- 확인
COMMENT ON COLUMN articles.content_summary IS 'AI가 생성한 상세 정리 (캐시됨)';
