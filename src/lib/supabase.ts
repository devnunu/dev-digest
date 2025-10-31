import { createClient } from '@supabase/supabase-js';

// Supabase 환경변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check .env.local file.'
  );
}

/**
 * Supabase 클라이언트 인스턴스
 * - NEXT_PUBLIC_ 접두사로 클라이언트 사이드에서도 사용 가능
 * - anon key는 Row Level Security (RLS) 정책에 따라 접근 제어됨
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
