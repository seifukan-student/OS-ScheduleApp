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

/** ブラウザに保存したキーのみ（VITE_ 経由は使わない＝本番バンドルに API キーを埋め込まない） */
export function getGeminiApiKey(): string | null {
  return getStoredGeminiApiKey()
}

export function isGeminiConfigured(): boolean {
  return !!getGeminiApiKey()
}
