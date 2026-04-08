const KEY_GEMINI = 'lumina_gemini_api_key'

/** 設定保存後に UI がキー有無を再評価できるよう購読する（useSyncExternalStore 用） */
export function subscribeGeminiApiKey(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_GEMINI || e.key === null) listener()
  }
  const onCustom = () => listener()
  window.addEventListener('storage', onStorage)
  window.addEventListener('lumina-api-key', onCustom)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('lumina-api-key', onCustom)
  }
}

export function getGeminiConfiguredSnapshot(): boolean {
  return !!getGeminiApiKey()
}

/** ブラウザに保存したキー（設定画面） */
export function getStoredGeminiApiKey(): string | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(KEY_GEMINI)
  return v?.trim() ? v.trim() : null
}

export function setStoredGeminiApiKey(key: string): void {
  localStorage.setItem(KEY_GEMINI, key.trim())
}

export function clearStoredGeminiApiKey(): void {
  localStorage.removeItem(KEY_GEMINI)
}

/** Vite の環境変数 or localStorage。どちらもなければデモ応答 */
export function getGeminiApiKey(): string | null {
  const env = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY
  if (typeof env === 'string' && env.trim()) return env.trim()
  return getStoredGeminiApiKey()
}

export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey()
}
