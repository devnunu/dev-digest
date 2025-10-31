-- Migration: Add title_ko field to articles table
-- Date: 2025-10-31
-- Description: 제목 한글 번역 필드 추가

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS title_ko TEXT;

-- 인덱스 추가 (한글 제목 검색용)
CREATE INDEX IF NOT EXISTS idx_articles_title_ko ON articles(title_ko);

-- 확인
COMMENT ON COLUMN articles.title_ko IS '기사 제목 한글 번역 (AI 생성)';
