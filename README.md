# DevDigest

개발자를 위한 기술 뉴스 큐레이션 서비스입니다. 영문 블로그 및 유튜브 콘텐츠를 수집하여 AI로 요약하고 한국어로 제공합니다.

## 기능

- 📰 RSS 피드를 통한 자동 콘텐츠 수집
- 🤖 AI 기반 콘텐츠 요약 (GPT-4o-mini)
- 🌏 한국어 3-5줄 요약 제공
- 📱 Android, iOS, Web, Backend 등 다양한 플랫폼 지원

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (Postgres)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 주요 패키지

- `rss-parser`: RSS 피드 파싱
- `@supabase/supabase-js`: Supabase 클라이언트
- `openai`: OpenAI API 클라이언트 (GPT-4o-mini)
- `date-fns`: 날짜 처리

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

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 5. 테스트

1. **RSS 피드 수집 테스트**: "Test RSS Fetch" 버튼을 클릭하여 RSS 피드를 파싱하고 데이터베이스에 저장합니다.
2. **기사 조회 테스트**: "Load Articles" 버튼을 클릭하여 저장된 기사를 불러옵니다.

## 프로젝트 구조

```
dev-digest/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── articles/      # 기사 조회 API
│   │   │   └── rss/           # RSS 파싱 API
│   │   ├── layout.tsx         # Root Layout
│   │   ├── page.tsx           # 홈페이지 (테스트 페이지)
│   │   └── globals.css        # Global Styles
│   ├── lib/                    # 유틸리티 함수
│   │   ├── supabase.ts        # Supabase 클라이언트 초기화
│   │   ├── db.ts              # 데이터베이스 관련 함수
│   │   └── rss.ts             # RSS 파싱 로직
│   └── types/                  # TypeScript 타입 정의
│       └── article.ts         # Article 타입
├── .env.local.example         # 환경변수 템플릿
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## API 엔드포인트

### GET /api/articles

저장된 기사를 조회합니다.

**쿼리 파라미터:**
- `platform` (optional): 플랫폼 필터 (`android`, `ios`, `web`, `backend`)
- `days` (optional): 최근 N일간 데이터 (기본값: 7)

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Article Title",
      "description": "Article description...",
      "source_url": "https://...",
      "published_at": "2025-10-31T00:00:00.000Z",
      "platform": "android",
      "content_type": "blog",
      "created_at": "2025-10-31T00:00:00.000Z"
    }
  ],
  "count": 1,
  "error": null
}
```

### POST /api/rss/fetch

RSS 피드를 파싱하고 데이터베이스에 저장합니다.

**요청 본문 (optional):**
```json
{
  "platform": "android"
}
```

**응답 예시:**
```json
{
  "success": true,
  "count": 10,
  "message": "Successfully fetched and stored 10 new articles",
  "error": null
}
```

## 데이터베이스 스키마

### articles 테이블

```sql
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  summary_ko TEXT,
  source_url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMP NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web', 'backend')),
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'video')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_articles_platform ON articles(platform);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_has_summary ON articles(summary_ko) WHERE summary_ko IS NOT NULL;
```

**컬럼 설명:**
- `summary_ko`: AI가 생성한 한국어 요약 (3-5줄)

## RSS 피드 소스

현재 지원하는 RSS 피드:

- **Android Developers Blog**: https://android-developers.googleblog.com/feeds/posts/default
- **Kotlin Blog**: https://blog.jetbrains.com/kotlin/feed/

## 배포

### Vercel에 배포

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `OPENAI_API_KEY`: OpenAI API 키
4. 배포

또는 Vercel CLI 사용:

```bash
npm install -g vercel
vercel
```

**주의:** Supabase 무료 플랜은 프로젝트당 500MB 데이터베이스 용량과 2GB 대역폭을 제공합니다.

## 개발 로드맵

### Step 1: 기본 인프라 구축 ✅
- [x] Next.js 프로젝트 설정
- [x] Supabase (Postgres) 연동
- [x] RSS 피드 파싱
- [x] 기본 API 구축

### Step 2: AI 요약 기능 ✅
- [x] OpenAI API 연동 (GPT-4o-mini)
- [x] 콘텐츠 요약 로직 구현
- [x] 한국어 3-5줄 요약 생성
- [x] 병렬 처리 및 Rate limit 관리
- [x] 토큰 사용량 로깅

### Step 3: UI/UX 개선 (예정)
- [ ] 메인 페이지 디자인
- [ ] 기사 상세 페이지
- [ ] 필터 및 검색 기능
- [ ] 반응형 디자인

### Step 4: 추가 기능 (예정)
- [ ] 사용자 인증
- [ ] 즐겨찾기 기능
- [ ] 푸시 알림
- [ ] 다양한 플랫폼 지원 (iOS, Web, Backend)

## 라이센스

MIT

## 기여

버그 리포트, 기능 제안, Pull Request는 언제나 환영합니다!
