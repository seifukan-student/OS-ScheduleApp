import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Key, RotateCcw, ExternalLink } from 'lucide-react'
import { useAppState } from '../store/AppContext'
import { tokens } from '../utils/design'
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
  isGeminiConfigured,
} from '../utils/aiConfig'

export const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useAppState()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch({ type: 'CLOSE_SETTINGS' }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  useEffect(() => {
    if (state.settingsOpen) {
      setApiKeyInput(getStoredGeminiApiKey() || '')
      setSavedMsg(null)
    }
  }, [state.settingsOpen])

  if (!state.settingsOpen) return null

  const envHasKey =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env?.VITE_GEMINI_API_KEY === 'string' &&
    !!import.meta.env.VITE_GEMINI_API_KEY.trim()

  const saveApiKey = () => {
    const t = apiKeyInput.trim()
    if (t) setStoredGeminiApiKey(t)
    else clearStoredGeminiApiKey()
    window.dispatchEvent(new Event('lumina-api-key'))
    setSavedMsg(t ? 'APIキーを保存しました。' : 'ブラウザに保存したキーを削除しました。')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
        style={{
          position: 'fixed',
          inset: 0,
          background: tokens.colors.overlay,
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 440,
            maxHeight: '90vh',
            overflowY: 'auto',
            background: tokens.colors.bg.secondary,
            borderRadius: 16,
            border: `1px solid ${tokens.colors.border.subtle}`,
            boxShadow: tokens.shadow.lg,
          }}
          className="custom-scrollbar"
        >
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.colors.border.subtle}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Settings size={20} color={tokens.colors.text.secondary} />
              <span style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.text.primary }}>設定</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
              style={{ padding: 6, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}
            >
              <X size={20} />
            </motion.button>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AI（Google Gemini）
            </div>
            <div style={{
              padding: 14,
              borderRadius: 12,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Key size={18} color={tokens.colors.accent.blue} />
                <span style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary }}>Gemini API キー</span>
              </div>
              <p style={{ fontSize: 12, color: tokens.colors.text.secondary, lineHeight: 1.5, marginBottom: 12 }}>
                チャットと「イベントからWBS」の AI 生成に使用します。キーがない場合はデモ応答・テンプレートのみ動作します。
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: tokens.colors.accent.blue,
                  marginBottom: 12,
                }}
              >
                <ExternalLink size={14} />
                Google AI Studio でキーを取得
              </a>
              <input
                type="password"
                autoComplete="off"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="AIza…"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${tokens.colors.border.default}`,
                  background: tokens.colors.bg.secondary,
                  color: tokens.colors.text.primary,
                  fontSize: 13,
                  marginBottom: 10,
                }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={saveApiKey}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: tokens.colors.accent.blue,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  保存
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setApiKeyInput(''); clearStoredGeminiApiKey(); window.dispatchEvent(new Event('lumina-api-key')); setSavedMsg('キーを削除しました。') }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: `1px solid ${tokens.colors.border.default}`,
                    background: 'transparent',
                    color: tokens.colors.text.secondary,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  キーを削除
                </motion.button>
              </div>
              {savedMsg && (
                <div style={{ marginTop: 10, fontSize: 12, color: tokens.colors.accent.green }}>{savedMsg}</div>
              )}
              <div style={{ marginTop: 12, fontSize: 11, color: tokens.colors.text.tertiary, lineHeight: 1.5 }}>
                {envHasKey ? '※ `.env` の `VITE_GEMINI_API_KEY` が設定されています（ビルド時に埋め込み）。ブラウザ保存より優先されます。' : '※ 開発時は `.env` に `VITE_GEMINI_API_KEY=` を書いても利用できます。'}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              アカウント（Google）
            </div>
            <div style={{
              padding: 14,
              borderRadius: 12,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 13, color: tokens.colors.text.secondary, lineHeight: 1.55, marginBottom: 10 }}>
                トップバーの「Sign in with Google」は、Google Cloud Console で「OAuth 2.0 クライアント ID（ウェブアプリケーション）」を作成し、
                <code style={{ fontSize: 12, background: tokens.colors.bg.tertiary, padding: '1px 6px', borderRadius: 4 }}>VITE_GOOGLE_CLIENT_ID</code>
                {' '}にクライアント ID を設定してください。承認済みの JavaScript 生成元に、ローカル（例: <code style={{ fontSize: 12 }}>http://localhost:3000</code>）と本番のオリジンを追加します。
              </p>
              <p style={{ fontSize: 12, color: tokens.colors.text.tertiary, lineHeight: 1.5 }}>
                ログイン情報はブラウザの localStorage に保存され、カレンダーデータの同期用ではありません（表示・識別用）。
              </p>
            </div>

            <div style={{
              padding: 14,
              borderRadius: 12,
              background: tokens.colors.bg.tertiary,
              border: `1px solid ${tokens.colors.border.subtle}`,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary, marginBottom: 6 }}>接続状態</div>
              <div style={{ fontSize: 13, color: isGeminiConfigured() ? tokens.colors.accent.green : tokens.colors.text.tertiary }}>
                {isGeminiConfigured() ? 'Gemini を利用できます' : 'デモモード（キー未設定）'}
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>データ</div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (window.confirm('カレンダー・タスク・チャット履歴を初期デモデータに戻しますか？')) {
                  dispatch({ type: 'RESET_TO_DEMO_DATA' })
                  setSavedMsg('デモデータにリセットしました。')
                }
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${tokens.colors.border.default}`,
                background: tokens.colors.bg.card,
                color: tokens.colors.text.primary,
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <RotateCcw size={16} />
              データをデモに戻す
            </motion.button>

            <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, margin: '20px 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>一般</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}` }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: tokens.colors.text.primary }}>週の開始曜日</div>
                <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 2 }}>月曜日</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}` }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: tokens.colors.text.primary }}>タイムゾーン</div>
                <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 2 }}>Asia/Tokyo（ブラウザの表示に依存）</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
