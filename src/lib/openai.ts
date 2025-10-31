import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 영문 콘텐츠를 한국어로 요약하는 함수 (JSON 구조화 응답)
 *
 * @param title - 기사 제목
 * @param description - 기사 설명/내용
 * @returns 한국어 제목, 요약, 키워드 또는 null (실패 시)
 */
export async function summarizeContent(
  title: string,
  description: string
): Promise<{ title_ko: string; summary: string; keywords: string[]; tokens: number } | null> {
  const startTime = Date.now();

  try {
    console.log(`[OpenAI] 요약 생성 시작: "${title}"`);

    if (!process.env.OPENAI_API_KEY) {
      console.error('[OpenAI] API 키가 설정되지 않았습니다.');
      return null;
    }

    // 요약 생성 프롬프트
    const prompt = `You are a technical content summarizer for Korean developers.

Article Title: ${title}
Article Content: ${description}

Create a JSON response with:
1. title_ko: Natural Korean translation of the title (one line)
2. summary_ko: 3-5 sentence Korean summary covering key points, developer impact, and main concepts
3. keywords: Array of 3-5 key technical terms or concepts

Rules:
- Respond ONLY with valid JSON, no additional text
- Do NOT include labels like "제목:" or "요약:" in the values
- Keep title_ko concise and natural
- Make summary_ko informative but brief
- Keywords should be technical terms in original language or Korean

Example format:
{
  "title_ko": "안드로이드 MVVM 패턴 마스터하기",
  "summary_ko": "이 글은 Hilt, Repository, Coroutines를 활용한 MVVM 아키텍처 구현 방법을 설명합니다. 의존성 주입을 통한 테스트 가능한 코드 작성과 비동기 처리를 다룹니다.",
  "keywords": ["MVVM", "Hilt", "Coroutines", "안드로이드", "아키텍처"]
}`;

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 기술 블로그 요약 전문가입니다. 개발자들이 빠르게 핵심을 파악할 수 있도록 간결하고 명확하게 요약하며, 반드시 JSON 형식으로 응답합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 700,
    });

    const content = response.choices[0]?.message?.content?.trim();
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) {
      console.error('[OpenAI] 요약 생성 실패: 응답이 비어있습니다.');
      return null;
    }

    // JSON 파싱
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('[OpenAI] JSON parsing failed:', parseError);
      console.error('[OpenAI] Raw content:', content);
      return null;
    }

    // 데이터 검증 및 정제
    let title_ko = parsed.title_ko || title;
    let summary = parsed.summary_ko || description.substring(0, 200);
    let keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];

    // "제목:", "요약:" 같은 라벨 제거
    title_ko = title_ko.replace(/^(제목|Title):\s*/i, '').trim();
    summary = summary.replace(/^(요약|Summary):\s*/i, '').trim();

    // 키워드 정제 (빈 문자열 제거)
    keywords = keywords.filter((k: string) => k && k.trim().length > 0).slice(0, 5);

    const elapsedTime = Date.now() - startTime;
    console.log(
      `[OpenAI] 요약 생성 완료: "${title_ko}" (${elapsedTime}ms, ${tokensUsed} tokens)`
    );

    return {
      title_ko,
      summary,
      keywords,
      tokens: tokensUsed,
    };
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(
      `[OpenAI] 요약 생성 실패: "${title}" (${elapsedTime}ms)`,
      error
    );

    // Rate limit 에러 처리
    if (error instanceof Error && error.message.includes('rate_limit')) {
      console.error('[OpenAI] Rate limit 초과. 잠시 후 다시 시도하세요.');
    }

    return null;
  }
}

/**
 * 콘텐츠의 상세 정리를 생성하는 함수
 *
 * @param title - 기사 제목
 * @param description - 기사 설명/내용
 * @returns 상세 정리 (한국어) 또는 null (실패 시)
 */
export async function generateDetailedSummary(
  title: string,
  description: string
): Promise<{ content_summary: string; tokens: number } | null> {
  const startTime = Date.now();

  try {
    console.log(`[OpenAI] 상세 정리 생성 시작: "${title}"`);

    if (!process.env.OPENAI_API_KEY) {
      console.error('[OpenAI] API 키가 설정되지 않았습니다.');
      return null;
    }

    const prompt = `다음은 안드로이드/모바일 개발 관련 기술 콘텐츠야.
이 콘텐츠의 핵심 내용을 한국 개발자가 한눈에 파악할 수 있도록 상세히 정리해줘.

제목: ${title}
내용: ${description}

다음 항목을 포함해서 정리해줘:
1. **핵심 내용**: 이 글의 주요 주제와 목적
2. **주요 포인트**: 핵심 기능, 변경사항, 또는 새로운 개념 (불릿 포인트로)
3. **개발자에게 미치는 영향**: 실무에 어떻게 적용할 수 있는지
4. **핵심 키워드**: 관련 기술 스택이나 개념

중요: 마크다운 형식으로 구조화해서 답변하되, 코드블록(\`\`\`)으로 감싸지 말고 순수 마크다운만 작성해줘.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 기술 콘텐츠 분석 전문가입니다. 개발자들이 빠르게 핵심을 파악하고 실무에 적용할 수 있도록 상세하고 구조화된 정리를 제공합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content_summary = response.choices[0]?.message?.content?.trim();
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content_summary) {
      console.error('[OpenAI] 상세 정리 생성 실패: 응답이 비어있습니다.');
      return null;
    }

    const elapsedTime = Date.now() - startTime;
    console.log(
      `[OpenAI] 상세 정리 생성 완료: "${title}" (${elapsedTime}ms, ${tokensUsed} tokens)`
    );

    return {
      content_summary,
      tokens: tokensUsed,
    };
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error(
      `[OpenAI] 상세 정리 생성 실패: "${title}" (${elapsedTime}ms)`,
      error
    );

    if (error instanceof Error && error.message.includes('rate_limit')) {
      console.error('[OpenAI] Rate limit 초과. 잠시 후 다시 시도하세요.');
    }

    return null;
  }
}

/**
 * 여러 콘텐츠를 순차적으로 요약하는 함수
 * Rate limit을 피하기 위해 요청 사이에 딜레이를 추가
 *
 * @param items - 요약할 아이템 배열
 * @param delayMs - 요청 사이 딜레이 (밀리초, 기본값: 1000ms)
 * @returns 요약 결과 배열
 */
export async function summarizeMultipleContents(
  items: Array<{ title: string; description: string }>,
  delayMs: number = 1000
): Promise<Array<{ summary: string; tokens: number } | null>> {
  const results: Array<{ summary: string; tokens: number } | null> = [];
  let totalTokens = 0;

  console.log(`[OpenAI] ${items.length}개 항목 요약 시작...`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = await summarizeContent(item.title, item.description);
    results.push(result);

    if (result) {
      totalTokens += result.tokens;
    }

    // Rate limit 방지를 위한 딜레이 (마지막 항목 제외)
    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const successCount = results.filter(r => r !== null).length;
  console.log(
    `[OpenAI] 요약 완료: ${successCount}/${items.length} 성공 (총 ${totalTokens} tokens 사용)`
  );

  return results;
}

/**
 * 병렬로 여러 콘텐츠를 요약하는 함수
 * 빠르지만 Rate limit에 주의 필요
 *
 * @param items - 요약할 아이템 배열
 * @param concurrency - 동시 요청 수 (기본값: 3)
 * @returns 요약 결과 배열
 */
export async function summarizeMultipleContentsParallel(
  items: Array<{ title: string; description: string }>,
  concurrency: number = 3
): Promise<Array<{ summary: string; tokens: number } | null>> {
  console.log(`[OpenAI] ${items.length}개 항목 병렬 요약 시작 (동시 요청: ${concurrency})...`);

  const results: Array<{ summary: string; tokens: number } | null> = [];

  // 동시 요청 수 제한
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(item => summarizeContent(item.title, item.description))
    );
    results.push(...chunkResults);
  }

  const successCount = results.filter(r => r !== null).length;
  const totalTokens = results.reduce((sum, r) => sum + (r?.tokens || 0), 0);

  console.log(
    `[OpenAI] 병렬 요약 완료: ${successCount}/${items.length} 성공 (총 ${totalTokens} tokens 사용)`
  );

  return results;
}
