# DevDigest

개발자를 위한 기술 뉴스 큐레이션 서비스입니다. 영문 블로그 및 유튜브 콘텐츠를 자동으로 수집하여 AI로 요약하고 한국어로 제공합니다.

## 주요 기능

### 📰 콘텐츠 수집
- **자동 RSS 수집**: Cron jobs를 통한 주기적 RSS 피드 수집
- **YouTube 통합**: YouTube RSS 및 API를 통한 영상 콘텐츠 수집
- **다양한 소스**: Android Developers Blog, Kotlin Blog, ProAndroidDev, Android Weekly 등

### 🤖 AI 기반 처리
- **한글 번역**: OpenAI GPT-4o-mini를 활용한 제목 및 요약 번역
- **키워드 추출**: 자동 키워드 추출 및 태그 표시 (최대 5개)
- **간단 요약**: 3-5줄 한국어 요약 제공
- **상세 정리**: 마크다운 형식의 상세한 AI 분석 (캐싱 지원)

### 🎯 사용자 경험
- **필터링**: 플랫폼(Android), 기간(7/14/30일), 콘텐츠 타입(Blog/Video) 필터
- **페이지네이션**: 12개씩 페이지 단위 표시
- **NEW 배지**: 24시간 이내 추가된 콘텐츠 표시
- **읽은 글 표시**: localStorage 기반 읽은 글 관리
- **북마크**: 즐겨찾기 기능 (localStorage)
- **반응형 디자인**: 모바일/태블릿/데스크톱 대응

### 🛠️ 개발 도구
- **RSS 수집 버튼**: 개발 환경에서 수동 RSS 수집
- **전체 삭제 버튼**: 테스트용 데이터 일괄 삭제

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel (예정)

## 주요 패키지

- `rss-parser`: RSS 피드 파싱
- `@supabase/supabase-js`: Supabase 클라이언트
- `openai`: OpenAI API 클라이언트 (GPT-4o-mini)
- `date-fns`: 날짜 및 시간 처리
- `react-markdown`: 마크다운 렌더링
- `remark-gfm`: GitHub Flavored Markdown 지원

## 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd dev-digest
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 프로젝트 설정

#### 3.1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인 (또는 회원가입)
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `dev-digest` (원하는 이름)
   - Database Password: 안전한 비밀번호 입력 (잘 보관하세요)
   - Region: 가까운 지역 선택 (예: Northeast Asia - Seoul)
4. "Create new project" 클릭 (프로젝트 생성에 1-2분 소요)

#### 3.2. 환경변수 설정

`.env.local.example` 파일을 `.env.local`로 복사:

```bash
cp .env.local.example .env.local
```

Supabase 대시보드에서 API 키 복사:

1. 프로젝트 대시보드에서 **Settings** (설정) 클릭
2. **API** 메뉴 선택
3. 다음 정보를 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`.env.local` 파일에 붙여넣기:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 3.3. 데이터베이스 테이블 생성

Supabase 대시보드에서 SQL Editor를 엽니다:

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. 아래 SQL을 복사하여 붙여넣기:

```sql
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMP NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web', 'backend')),
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'video')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_platform ON articles(platform);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
```

4. **Run** 버튼 클릭하여 실행
5. "Success. No rows returned" 메시지 확인

#### 3.4. OpenAI API 키 설정

1. [OpenAI Platform](https://platform.openai.com/api-keys)에 로그인
2. **Create new secret key** 클릭
3. 생성된 API 키를 복사 (주의: 한 번만 표시됩니다!)
4. `.env.local` 파일에 추가:

```env
OPENAI_API_KEY="sk-proj-..."
```

**참고:**
- GPT-4o-mini 모델을 사용하여 비용을 최소화합니다
- 입력: ~$0.150 / 1M tokens, 출력: ~$0.600 / 1M tokens
- 기사 하나당 평균 500-1000 tokens 사용 예상

#### 3.5. YouTube API 키 설정 (선택사항)

YouTube 콘텐츠의 상세 정보를 가져오려면 YouTube Data API v3 키가 필요합니다:

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services > Library**로 이동
4. "YouTube Data API v3" 검색 및 활성화
5. **APIs & Services > Credentials**로 이동
6. **Create Credentials > API Key** 클릭
7. 생성된 API 키를 `.env.local` 파일에 추가:

```env
YOUTUBE_API_KEY="AIzaSy..."
```

**참고:**
- YouTube API는 일일 할당량 10,000 units 제공 (무료)
- 영상 정보 조회는 1 unit 소비
- API 키 없이도 RSS 피드를 통해 기본 정보는 수집 가능

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 5. 데이터베이스 마이그레이션 실행

프로젝트에 포함된 마이그레이션 파일을 순서대로 실행하세요:

1. Supabase 대시보드의 SQL Editor로 이동
2. 다음 파일들을 순서대로 실행:
   - `migrations/001_initial_schema.sql`
   - `migrations/002_add_summary_field.sql`
   - `migrations/003_add_title_ko_field.sql`
   - `migrations/004_add_keywords_field.sql`
   - `migrations/005_add_content_summary_field.sql`

### 6. 개발 환경에서 콘텐츠 수집

개발 환경(`npm run dev`)에서는 헤더에 관리 도구가 표시됩니다:

1. **🔄 RSS 수집**: RSS 피드를 수동으로 수집하고 AI 요약 생성
2. **🗑️ 전체 삭제**: 데이터베이스의 모든 article 삭제 (테스트용)

첫 실행 시 "RSS 수집" 버튼을 클릭하여 초기 데이터를 수집하세요.

## 사용 방법

### 메인 페이지
- **필터**: 상단 필터바에서 기간(7/14/30일), 콘텐츠 타입(전체/Blog/Video) 선택
- **북마크**: 별 아이콘(☆)을 클릭하여 즐겨찾기 추가/제거
- **읽은 글**: 카드를 클릭하면 읽은 글로 표시 (투명도 낮아짐)
- **NEW 배지**: 24시간 이내 추가된 콘텐츠에 표시
- **페이지네이션**: 하단 페이지 버튼으로 이동

### 상세 페이지
- **원문/한글 전환**: "원문으로 보기" 버튼으로 제목 전환
- **원문 보기**: 외부 링크로 원본 콘텐츠 접근
- **AI 상세 정리**: AI 정리 버튼 클릭으로 마크다운 형식의 상세 분석 생성 (한 번만 생성, 이후 캐시)

### 로컬 데이터
- 읽은 글과 북마크는 브라우저 localStorage에 저장됩니다
- 브라우저 데이터 삭제 시 초기화됩니다

## 프로젝트 구조

```
dev-digest/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── articles/             # 기사 관련 API
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts      # 기사 상세 조회
│   │   │   │   │   └── summarize/    # AI 상세 정리 생성
│   │   │   │   ├── delete-all/       # 전체 삭제 (dev only)
│   │   │   │   └── route.ts          # 기사 목록 조회
│   │   │   └── cron/                 # Cron Jobs
│   │   │       └── fetch/            # 자동 RSS 수집
│   │   ├── article/[id]/             # 기사 상세 페이지
│   │   │   └── page.tsx
│   │   ├── layout.tsx                # Root Layout
│   │   ├── page.tsx                  # 메인 페이지
│   │   └── globals.css               # Global Styles (마크다운 포함)
│   ├── components/                    # React 컴포넌트
│   │   ├── Header.tsx                # 헤더 (RSS 수집 버튼)
│   │   ├── FilterBar.tsx             # 필터 컴포넌트
│   │   ├── ArticleList.tsx           # 기사 목록
│   │   ├── ArticleCard.tsx           # 기사 카드
│   │   └── Pagination.tsx            # 페이지네이션
│   ├── lib/                           # 유틸리티 함수
│   │   ├── supabase.ts               # Supabase 클라이언트
│   │   ├── db.ts                     # DB 관련 함수
│   │   ├── rss.ts                    # RSS 파싱 로직
│   │   ├── openai.ts                 # OpenAI 연동
│   │   └── youtube.ts                # YouTube API 연동
│   └── types/                         # TypeScript 타입
│       └── article.ts                # Article 타입
├── migrations/                        # DB 마이그레이션
│   ├── 001_initial_schema.sql
│   ├── 002_add_summary_field.sql
│   ├── 003_add_title_ko_field.sql
│   ├── 004_add_keywords_field.sql
│   └── 005_add_content_summary_field.sql
├── .env.local.example                # 환경변수 템플릿
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## API 엔드포인트

### GET /api/articles

저장된 기사 목록을 조회합니다. 페이지네이션 지원.

**쿼리 파라미터:**
- `platform` (optional): 플랫폼 필터 (`android`, `ios`, `web`, `backend`)
- `days` (optional): 최근 N일간 데이터 (기본값: 7)
- `content_type` (optional): 콘텐츠 타입 (`blog`, `video`)
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 12, 최대: 100)

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Original Title",
      "title_ko": "한글 제목",
      "description": "Original description...",
      "summary_ko": "한글 요약...",
      "keywords": ["Kotlin", "Android", "MVVM"],
      "content_summary": "## 핵심 내용\n...",
      "source_url": "https://...",
      "published_at": "2025-10-31T00:00:00.000Z",
      "platform": "android",
      "content_type": "blog",
      "created_at": "2025-10-31T00:00:00.000Z"
    }
  ],
  "count": 12,
  "total": 45,
  "page": 1,
  "totalPages": 4,
  "error": null
}
```

### GET /api/articles/[id]

특정 기사의 상세 정보를 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Article Title",
    "title_ko": "한글 제목",
    "description": "...",
    "summary_ko": "...",
    "keywords": ["Kotlin", "Android"],
    "content_summary": "...",
    "source_url": "https://...",
    "published_at": "2025-10-31T00:00:00.000Z",
    "platform": "android",
    "content_type": "blog",
    "created_at": "2025-10-31T00:00:00.000Z"
  },
  "error": null
}
```

### POST /api/articles/[id]/summarize

특정 기사의 AI 상세 정리를 생성합니다. 이미 생성된 경우 캐시된 내용을 반환합니다.

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "content_summary": "## 핵심 내용\n...",
    "tokens": 850,
    "cached": false
  }
}
```

### POST /api/cron/fetch

RSS 피드를 수집하고 AI 요약을 생성합니다. Vercel Cron에서 주기적으로 호출됩니다.

**헤더:**
- `Authorization: Bearer <CRON_SECRET>` (프로덕션)
- 개발 환경에서는 인증 불필요

**응답 예시:**
```json
{
  "success": true,
  "count": 10,
  "message": "Successfully fetched 10 new articles"
}
```

### DELETE /api/articles/delete-all

모든 기사를 삭제합니다. 개발 환경 전용.

**응답 예시:**
```json
{
  "success": true,
  "count": 45,
  "message": "All articles deleted successfully"
}
```

## 데이터베이스 스키마

### articles 테이블

```sql
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ko TEXT,
  description TEXT,
  summary_ko TEXT,
  keywords TEXT[],
  content_summary TEXT,
  source_url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMP NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web', 'backend')),
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'video')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_articles_platform ON articles(platform);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_has_summary ON articles(summary_ko) WHERE summary_ko IS NOT NULL;
```

**컬럼 설명:**
- `title`: 원문 제목
- `title_ko`: AI가 번역한 한국어 제목
- `description`: 원문 설명/내용
- `summary_ko`: AI가 생성한 한국어 요약 (3-5문장)
- `keywords`: AI가 추출한 키워드 배열 (최대 5개)
- `content_summary`: AI가 생성한 상세 마크다운 정리 (캐싱됨)
- `platform`: 플랫폼 구분 (android, ios, web, backend)
- `content_type`: 콘텐츠 타입 (blog, video)
- `created_at`: 데이터베이스 추가 시각 (NEW 배지 기준)

## RSS 피드 소스

현재 지원하는 RSS 피드 (Android 플랫폼):

### 블로그
- **Android Developers Blog**: https://android-developers.googleblog.com/feeds/posts/default
- **Kotlin Blog**: https://blog.jetbrains.com/kotlin/feed/
- **ProAndroidDev**: https://proandroiddev.com/feed
- **Android Weekly**: https://androidweekly.net/feed

### YouTube
- **Android Developers**: https://www.youtube.com/feeds/videos.xml?channel_id=UCVHFbqXqoYvEWM1Ddxl0qDg
- **Philipp Lackner**: https://www.youtube.com/feeds/videos.xml?channel_id=UCKNTZMRHPLXfqlbdOI7mCkg
- **Coding in Flow**: https://www.youtube.com/feeds/videos.xml?channel_id=UC_Fh8kvtkVPkeihBs42jGcA

**추가 예정:**
- iOS 플랫폼 소스
- Web 플랫폼 소스
- Backend 플랫폼 소스

## 배포

### Vercel에 배포

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `OPENAI_API_KEY`: OpenAI API 키
   - `YOUTUBE_API_KEY`: YouTube Data API v3 키 (선택사항)
   - `CRON_SECRET`: Cron job 인증용 시크릿 키
4. Cron Jobs 설정 (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

5. 배포

또는 Vercel CLI 사용:

```bash
npm install -g vercel
vercel
```

**참고:**
- Supabase 무료 플랜: 500MB DB, 2GB 대역폭
- Vercel 무료 플랜: Cron jobs 1일 최대 실행 횟수 제한 있음
- OpenAI API 비용: 기사당 약 $0.001-0.002

## 개발 로드맵

### Step 1: 기본 인프라 구축 ✅
- [x] Next.js 16 프로젝트 설정
- [x] Supabase (PostgreSQL) 연동
- [x] RSS 피드 파싱
- [x] 기본 API 구축
- [x] TypeScript 타입 정의

### Step 2: AI 요약 기능 ✅
- [x] OpenAI API 연동 (GPT-4o-mini)
- [x] 한국어 제목 번역 (title_ko)
- [x] 한국어 3-5문장 요약 생성 (summary_ko)
- [x] 키워드 자동 추출 (keywords)
- [x] 마크다운 상세 정리 생성 (content_summary)
- [x] AI 응답 캐싱으로 중복 호출 방지
- [x] 병렬 처리 및 Rate limit 관리
- [x] 토큰 사용량 로깅

### Step 3: UI/UX 개선 ✅
- [x] 메인 페이지 디자인 (그리드 레이아웃)
- [x] 기사 상세 페이지
- [x] 필터 기능 (플랫폼/기간/콘텐츠 타입)
- [x] 페이지네이션 (12개씩)
- [x] NEW 배지 (24시간 이내)
- [x] 읽은 글 표시 (localStorage)
- [x] 북마크 기능 (localStorage)
- [x] 키워드 태그 UI
- [x] 마크다운 렌더링 (react-markdown)
- [x] 반응형 디자인 (모바일/태블릿/데스크톱)

### Step 4: 자동화 및 확장 ✅
- [x] Cron jobs로 자동 RSS 수집
- [x] YouTube API 통합
- [x] 다양한 RSS 소스 추가 (7개 채널)
- [x] 개발 환경 도구 (수집/삭제 버튼)

### Step 5: 추가 기능 (예정)
- [ ] 사용자 인증 (Supabase Auth)
- [ ] 서버 사이드 북마크/읽은 글 저장
- [ ] 이메일 알림 (신규 콘텐츠)
- [ ] 다양한 플랫폼 지원 (iOS, Web, Backend)
- [ ] 전문 검색 기능
- [ ] 다크 모드
- [ ] PWA 지원

## 라이센스

MIT

## 기여

버그 리포트, 기능 제안, Pull Request는 언제나 환영합니다!
