import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { tokens } from '../utils/design'

export const SearchOverlay: React.FC = () => {
  const { state, dispatch } = useAppState()
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'CLOSE_SEARCH' })
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        dispatch({ type: state.searchOpen ? 'CLOSE_SEARCH' : 'OPEN_SEARCH' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, state.searchOpen])

  const filtered = useMemo(() => {
    if (!query.trim()) return [...state.events].sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 10)
    const q = query.toLowerCase().trim()
    return state.events.filter(e => e.title.toLowerCase().includes(q) || (e.description?.toLowerCase().includes(q)))
  }, [state.events, query])

  if (!state.searchOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dispatch({ type: 'CLOSE_SEARCH' })}
        style={{
          position: 'fixed',
          inset: 0,
          background: tokens.colors.bg.overlay,
          zIndex: 1500,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 120,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 480,
            background: tokens.colors.bg.secondary,
            borderRadius: 16,
            border: `1px solid ${tokens.colors.border.subtle}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 12, borderBottom: `1px solid ${tokens.colors.border.subtle}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={18} color={tokens.colors.text.tertiary} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="予定を検索..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: tokens.colors.text.primary,
                fontSize: 15,
              }}
            />
            <kbd style={{ fontSize: 11, color: tokens.colors.text.tertiary, background: tokens.colors.bg.card, padding: '2px 6px', borderRadius: 4 }}>Esc</kbd>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => dispatch({ type: 'CLOSE_SEARCH' })}
              style={{ padding: 6, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}
            >
              <X size={18} />
            </motion.button>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }} className="custom-scrollbar">
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: tokens.colors.text.tertiary, fontSize: 13 }}>該当する予定がありません</div>
            ) : (
              filtered.map(evt => (
                <motion.div
                  key={evt.id}
                  whileHover={{ background: tokens.colors.bg.cardHover }}
                  onClick={() => {
                    dispatch({ type: 'SELECT_EVENT', payload: evt.id })
                    dispatch({ type: 'CLOSE_SEARCH' })
                  }}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: evt.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.title}</div>
                    <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 2 }}>{format(evt.start, 'M月d日(E) H:mm', { locale: ja })}</div>
                  </div>
                  <Calendar size={14} color={tokens.colors.text.tertiary} />
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
