/** Google OAuth（Supabase 経由）で Google に渡る redirect_uri（Console に登録する値） */
export function getSupabaseAuthCallbackUrl(): string | null {
  const raw = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const base = raw?.trim()
  if (!base) return null
  try {
    const u = new URL(base.endsWith('/') ? base : `${base}/`)
    return `${u.origin}/auth/v1/callback`
  } catch {
    return null
  }
}
