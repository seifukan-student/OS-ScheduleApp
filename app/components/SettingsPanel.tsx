import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Key, RotateCcw, ExternalLink, User, LogOut } from 'lucide-react'
import { useAppState } from '../store/AppContext'
import { useAuth } from '../auth/AuthContext'
import { tokens } from '../utils/design'
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
  isGeminiConfigured,
} from '../utils/aiConfig'
import { saveUserSettings, fetchUserSettings } from '../lib/database'
import type { UserSettings, ViewMode } from '../types'

const defaultSettings: UserSettings = {
  displayName: '',
  theme: 'light',
  weekStartsOn: 1,
  defaultView: 'week',
  notificationsEnabled: true,
  geminiApiKey: '',
}

export const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useAppState()
  const { user, logout } = useAuth()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch({ type: 'CLOSE_SETTINGS' }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  useEffect(() => {
    if (state.settingsOpen && user) {
      setApiKeyInput(getStoredGeminiApiKey() || '')
      setSavedMsg(null)
      fetchUserSettings(user.id).then(s => {
        if (s) setSettings(s)
      }).catch(() => {})
    }
  }, [state.settingsOpen, user])

  if (!state.settingsOpen) return null

  const saveApiKey = () => {
    const t = apiKeyInput.trim()
    if (t) setStoredGeminiApiKey(t)
    else clearStoredGeminiApiKey()
    window.dispatchEvent(new Event('lumina-api-key'))
    setSavedMsg(t ? 'APIキーを保存しました。' : 'キーを削除しました。')
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    if (user) saveUserSettings(user.id, next).catch(() => {})
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${tokens.colors.border.default}`,
    background: tokens.colors.bg.secondary,
    color: tokens.colors.text.primary,
    fontSize: 13,
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  }

  const sectionTitle = (label: string) => (
    <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </div>
  )

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
        style={{
          position: 'fixed', inset: 0, background: tokens.colors.bg.overlay,
          zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480, maxHeight: '90dvh', overflowY: 'auto',
            background: tokens.colors.bg.secondary, borderRadius: 16,
            border: `1px solid ${tokens.colors.border.subtle}`, boxShadow: tokens.shadow.lg,
          }}
          className="custom-scrollbar"
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.colors.border.subtle}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Settings size={20} color={tokens.colors.text.secondary} />
              <span style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.text.primary }}>設定</span>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
              style={{ padding: 6, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}>
              <X size={20} />
            </motion.button>
          </div>

          <div style={{ padding: 20 }}>
            {/* ─── プロフィール ─── */}
            {sectionTitle('プロフィール')}
            <div style={{ padding: 16, borderRadius: 12, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}`, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {user?.picture ? (
                  <img src={user.picture} alt="" width={48} height={48} style={{ borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: tokens.colors.bg.tertiary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={22} color={tokens.colors.text.tertiary} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>{user?.name || 'ユーザー'}</div>
                  <div style={{ fontSize: 12, color: tokens.colors.text.tertiary }}>{user?.email}</div>
                </div>
              </div>
              <label style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.secondary }}>
                表示名
                <input
                  value={settings.displayName}
                  onChange={e => updateSetting('displayName', e.target.value)}
                  placeholder={user?.name || 'ニックネーム'}
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              </label>
            </div>

            {/* ─── 一般設定 ─── */}
            {sectionTitle('一般')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.secondary }}>
                デフォルト表示
                <select value={settings.defaultView} onChange={e => updateSetting('defaultView', e.target.value as ViewMode)} style={{ ...selectStyle, marginTop: 6 }}>
                  <option value="month">月</option>
                  <option value="week">週</option>
                  <option value="day">日</option>
                  <option value="agenda">リスト</option>
                </select>
              </label>

              <label style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.secondary }}>
                週の開始曜日
                <select value={settings.weekStartsOn} onChange={e => updateSetting('weekStartsOn', Number(e.target.value) as 0 | 1)} style={{ ...selectStyle, marginTop: 6 }}>
                  <option value={1}>月曜日</option>
                  <option value={0}>日曜日</option>
                </select>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.secondary }}>通知を有効にする</span>
                <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={e => updateSetting('notificationsEnabled', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                  />
                  <div style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: settings.notificationsEnabled ? tokens.colors.accent.blue : tokens.colors.bg.tertiary,
                    transition: 'background 0.2s', position: 'relative',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, left: settings.notificationsEnabled ? 23 : 3,
                      transition: 'left 0.2s', boxShadow: tokens.shadow.sm,
                    }} />
                  </div>
                </label>
              </div>
            </div>

            {/* ─── AI ─── */}
            {sectionTitle('AI（Google Gemini）')}
            <div style={{ padding: 14, borderRadius: 12, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}`, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Key size={18} color={tokens.colors.accent.blue} />
                <span style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary }}>Gemini API キー</span>
              </div>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: tokens.colors.accent.blue, marginBottom: 12 }}>
                <ExternalLink size={14} /> Google AI Studio でキーを取得
              </a>
              <input type="password" autoComplete="off" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="AIza…" style={{ ...inputStyle, marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button whileTap={{ scale: 0.98 }} onClick={saveApiKey}
                  style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: tokens.colors.accent.blue, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  保存
                </motion.button>
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => { setApiKeyInput(''); clearStoredGeminiApiKey(); window.dispatchEvent(new Event('lumina-api-key')); setSavedMsg('キーを削除しました。') }}
                  style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${tokens.colors.border.default}`, background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer', fontSize: 13 }}>
                  キーを削除
                </motion.button>
              </div>
              {savedMsg && <div style={{ marginTop: 10, fontSize: 12, color: tokens.colors.accent.green }}>{savedMsg}</div>}
              <div style={{ marginTop: 12, fontSize: 11, color: tokens.colors.text.tertiary, lineHeight: 1.5 }}>
                API キーはこの端末のブラウザにだけ保存され、本番ビルドの JS には埋め込みません。
              </div>
            </div>

            {/* ─── 接続状態 ─── */}
            <div style={{ padding: 14, borderRadius: 12, background: tokens.colors.bg.tertiary, border: `1px solid ${tokens.colors.border.subtle}`, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary, marginBottom: 6 }}>接続状態</div>
              <div style={{ fontSize: 13, color: isGeminiConfigured() ? tokens.colors.accent.green : tokens.colors.text.tertiary }}>
                {isGeminiConfigured() ? 'Gemini を利用できます' : 'デモモード（キー未設定）'}
              </div>
            </div>

            {/* ─── データ ─── */}
            {sectionTitle('データ')}
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (window.confirm('カレンダー・タスク・チャット履歴を初期化しますか？')) {
                  dispatch({ type: 'RESET_TO_DEMO_DATA' })
                  setSavedMsg('データをリセットしました。')
                }
              }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${tokens.colors.border.default}`, background: tokens.colors.bg.card,
                color: tokens.colors.text.primary, cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16,
              }}>
              <RotateCcw size={16} /> データを初期化
            </motion.button>

            {/* ─── ログアウト ─── */}
            <motion.button whileTap={{ scale: 0.98 }}
              onClick={async () => {
                dispatch({ type: 'CLOSE_SETTINGS' })
                await logout()
              }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid rgba(239,68,68,0.3)`, background: 'rgba(217,48,37,0.08)',
                color: tokens.colors.accent.red, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <LogOut size={16} /> ログアウト
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
