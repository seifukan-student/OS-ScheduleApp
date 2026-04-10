import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''

/**
 * 空の URL / キーで createClient すると SDK が即座に throw し、アプリ全体が真っ白になる。
 * 未設定時はクライアントを作らない。
 *
 * 注意: `.env` ファイルは dist にコピーされないが、Vite は `import.meta.env.VITE_*` をビルド時に
 * バンドル内の文字列へ置換する。Supabase の anon キーは「公開前提」で RLS が本体の防御線。
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
