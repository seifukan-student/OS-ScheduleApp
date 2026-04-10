/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase プロジェクト URL（公開前提。`.env` 自体は dist に含まれないが、値は参照箇所に埋め込まれる） */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon 公開キー（同上） */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
