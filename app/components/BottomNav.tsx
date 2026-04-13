import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, CheckSquare, BarChart3, Users, Plus } from 'lucide-react'
import { useAppState } from '../store/AppContext'
import { tokens } from '../utils/design'

const navItems = [
  { id: 'calendar', icon: Calendar, label: 'カレンダー' },
  { id: 'wbs', icon: CheckSquare, label: 'タスク' },
  { id: 'analytics', icon: BarChart3, label: '分析' },
  { id: 'team', icon: Users, label: 'チーム' },
]

const navForPanel: Record<string, string> = {
  calendar: 'calendar',
  wbs: 'wbs',
  both: 'calendar',
  analytics: 'analytics',
  team: 'team',
}

export const BottomNav: React.FC = () => {
  const { state, dispatch } = useAppState()
  const activeNav = navForPanel[state.activePanel] || 'calendar'

  const handleNavClick = (id: string) => {
    dispatch({ type: 'SET_PANEL', payload: id as typeof state.activePanel })
    if (state.sidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(56px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: tokens.colors.bg.secondary,
        borderTop: `1px solid ${tokens.colors.border.subtle}`,
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 500,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {navItems.slice(0, 2).map(({ id, icon: Icon, label }) => {
        const isActive = activeNav === id
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavClick(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: isActive ? tokens.colors.accent.blue : tokens.colors.text.tertiary,
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400 }}>{label}</span>
          </motion.button>
        )
      })}

      {/* Center FAB */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL' })}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Plus size={22} color="#fff" />
        </motion.button>
      </div>

      {navItems.slice(2).map(({ id, icon: Icon, label }) => {
        const isActive = activeNav === id
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavClick(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: isActive ? tokens.colors.accent.blue : tokens.colors.text.tertiary,
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400 }}>{label}</span>
          </motion.button>
        )
      })}
    </nav>
  )
}
