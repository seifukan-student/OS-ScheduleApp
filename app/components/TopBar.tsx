import React from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight,
  Search, Menu, Bell, Zap
} from 'lucide-react'
import { format, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { useAuth } from '../auth/AuthContext'
import { tokens } from '../utils/design'
import { ViewMode } from '../types'

const viewButtons: { mode: ViewMode; label: string }[] = [
  { mode: 'month', label: '月' },
  { mode: 'week', label: '週' },
  { mode: 'day', label: '日' },
  { mode: 'agenda', label: 'リスト' },
]

export const TopBar: React.FC = () => {
  const { state, dispatch } = useAppState()
  const { user } = useAuth()

  const navigate = (dir: 1 | -1) => {
    const d = state.currentDate
    if (state.viewMode === 'month') dispatch({ type: 'SET_DATE', payload: dir > 0 ? addMonths(d, 1) : subMonths(d, 1) })
    else if (state.viewMode === 'week') dispatch({ type: 'SET_DATE', payload: dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1) })
    else dispatch({ type: 'SET_DATE', payload: dir > 0 ? addDays(d, 1) : subDays(d, 1) })
  }

  const getTitle = () => {
    if (state.viewMode === 'month') return format(state.currentDate, 'yyyy年 MMMM', { locale: ja })
    if (state.viewMode === 'week') {
      const start = addDays(state.currentDate, -(state.currentDate.getDay() || 7) + 1)
      const end = addDays(start, 6)
      return `${format(start, 'M月d日')} - ${format(end, 'M月d日, yyyy年', { locale: ja })}`
    }
    return format(state.currentDate, 'yyyy年M月d日(E)', { locale: ja })
  }

  return (
    <header style={{
      height: 60, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
      borderBottom: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.bg.secondary, flexShrink: 0,
    }}>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer' }}>
        <Menu size={18} />
      </motion.button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
          style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer' }}>
          <ChevronLeft size={18} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(1)}
          style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer' }}>
          <ChevronRight size={18} />
        </motion.button>
      </div>

      <motion.h1 key={getTitle()} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 16, fontWeight: 600, color: tokens.colors.text.primary, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
        {getTitle()}
      </motion.h1>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => dispatch({ type: 'SET_DATE', payload: new Date() })}
        style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${tokens.colors.border.default}`, background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
        今日
      </motion.button>

      <div style={{ flex: 1 }} />

      {/* User avatar */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}>
          {user.picture ? (
            <img src={user.picture} alt="" width={28} height={28} style={{ borderRadius: '50%', border: `1px solid ${tokens.colors.border.subtle}` }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: tokens.colors.bg.tertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tokens.colors.text.secondary }}>
              {(user.name || user.email || '?').charAt(0)}
            </div>
          )}
          <span style={{ fontSize: 12, color: tokens.colors.text.secondary, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name || user.email}
          </span>
        </div>
      )}

      {/* View Mode Switcher */}
      <div style={{ display: 'flex', background: tokens.colors.bg.tertiary, borderRadius: 10, padding: 3, gap: 2, border: `1px solid ${tokens.colors.border.subtle}` }}>
        {viewButtons.map(({ mode, label }) => (
          <motion.button key={mode} whileTap={{ scale: 0.96 }} onClick={() => dispatch({ type: 'SET_VIEW', payload: mode })}
            style={{
              padding: '5px 12px', borderRadius: 7, border: 'none',
              background: state.viewMode === mode ? tokens.colors.bg.card : 'transparent',
              color: state.viewMode === mode ? tokens.colors.text.primary : tokens.colors.text.tertiary,
              cursor: 'pointer', fontSize: 12, fontWeight: state.viewMode === mode ? 600 : 400,
              transition: 'all 0.15s ease', boxShadow: state.viewMode === mode ? tokens.shadow.sm : 'none',
            }}>
            {label}
          </motion.button>
        ))}
      </div>

      {/* Search */}
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => dispatch({ type: 'OPEN_SEARCH' })}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: tokens.colors.bg.tertiary, border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: 10, padding: '6px 12px', width: 200, cursor: 'pointer' }}>
        <Search size={14} color={tokens.colors.text.tertiary} />
        <span style={{ fontSize: 12.5, color: tokens.colors.text.tertiary }}>検索...</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: tokens.colors.text.tertiary, background: tokens.colors.bg.card, padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
      </motion.button>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
        style={{
          padding: '8px 14px', borderRadius: 10,
          background: state.chatOpen ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : tokens.colors.bg.card,
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600,
          boxShadow: state.chatOpen ? tokens.shadow.sm : 'none', border: state.chatOpen ? '1px solid transparent' : `1px solid ${tokens.colors.border.default}`,
        }}>
        <Zap size={14} /> AI
      </motion.button>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => dispatch({ type: 'OPEN_NOTIFICATIONS' })}
        style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer', position: 'relative' }}>
        <Bell size={18} />
        <div style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: tokens.colors.accent.red, border: `1.5px solid ${tokens.colors.bg.secondary}` }} />
      </motion.button>
    </header>
  )
}
