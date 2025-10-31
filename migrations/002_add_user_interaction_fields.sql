-- Migration: Add user interaction fields to articles table
-- Date: 2025-10-31
-- Description: 새글 배지, 읽음 표시, 북마크 기능을 위한 필드 추가

-- is_new: 24시간 이내 등록된 글인지 표시 (자동 계산)
-- is_read: 사용자가 읽은 글인지 표시 (클라이언트에서 관리)
-- is_bookmarked: 사용자가 북마크한 글인지 표시

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT FALSE;

-- 읽음 표시를 위한 별도 테이블 생성 (선택사항)
-- 추후 사용자 인증 추가 시 user_id와 연결
CREATE TABLE IF NOT EXISTS article_reads (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id)
);

-- 북마크를 위한 별도 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS article_bookmarks (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (article_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_articles_bookmarked ON articles(is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_article_reads_read_at ON article_reads(read_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_bookmarked_at ON article_bookmarks(bookmarked_at DESC);

-- 확인
COMMENT ON COLUMN articles.is_bookmarked IS '사용자가 북마크한 글';
COMMENT ON TABLE article_reads IS '사용자가 읽은 글 기록';
COMMENT ON TABLE article_bookmarks IS '사용자가 북마크한 글 기록';
