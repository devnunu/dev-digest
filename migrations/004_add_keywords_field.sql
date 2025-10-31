-- Migration: Add keywords field to articles table
-- Date: 2025-10-31
-- Description: AI가 추출한 핵심 키워드 배열 필드 추가

-- Supabase는 PostgreSQL을 사용하므로 TEXT[] 타입 사용
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- 인덱스 추가 (키워드 검색용 - GIN 인덱스)
CREATE INDEX IF NOT EXISTS idx_articles_keywords ON articles USING GIN (keywords);

-- 확인
COMMENT ON COLUMN articles.keywords IS 'AI가 추출한 핵심 키워드 배열';
