import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { tokens } from '../utils/design'

const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'ようこそ', body: '予定は左上の「新規作成」またはカレンダーの空き枠から追加できます。', time: new Date(), read: false },
  { id: 'n2', title: 'AI アシスタント', body: '設定で Gemini API キーを設定するとチャットが強化されます。', time: new Date(Date.now() - 3600000), read: true },
]

export const NotificationsPanel: React.FC = () => {
  const { state, dispatch } = useAppState()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch({ type: 'CLOSE_NOTIFICATIONS' }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  if (!state.notificationsOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dispatch({ type: 'CLOSE_NOTIFICATIONS' })}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          zIndex: 1400,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 64,
            right: 20,
            width: 360,
            maxHeight: 400,
            background: tokens.colors.bg.secondary,
            borderRadius: 14,
            border: `1px solid ${tokens.colors.border.subtle}`,
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${tokens.colors.border.subtle}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={18} color={tokens.colors.text.secondary} />
              <span style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary }}>通知</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => dispatch({ type: 'CLOSE_NOTIFICATIONS' })}
              style={{ padding: 4, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}
            >
              <X size={16} />
            </motion.button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
            {MOCK_NOTIFICATIONS.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: tokens.colors.text.tertiary, fontSize: 13 }}>通知はありません</div>
            ) : (
              MOCK_NOTIFICATIONS.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                    background: n.read ? 'transparent' : 'rgba(26,115,232,0.06)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 4 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginTop: 6 }}>{format(n.time, 'M/d H:mm', { locale: ja })}</div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
