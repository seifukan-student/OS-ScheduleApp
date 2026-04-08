import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, CheckSquare, MessageSquare, Settings, Bell, Search,
  ChevronLeft, ChevronRight, Plus, Zap, LayoutGrid, Moon, Sun,
  BarChart3, Target, Clock, Users, Inbox
} from 'lucide-react'
import { useAppState } from '../store/AppContext'
import { tokens, glassStyle } from '../utils/design'

const navItems = [
  { id: 'calendar', icon: Calendar, label: 'カレンダー' },
  { id: 'wbs', icon: CheckSquare, label: 'タスク' },
  { id: 'analytics', icon: BarChart3, label: '分析' },
  { id: 'team', icon: Users, label: 'チーム' },
]

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useAppState()
  const [activeNav, setActiveNav] = useState('calendar')

  const handleNavClick = (id: string) => {
    setActiveNav(id)
    if (id === 'calendar') dispatch({ type: 'SET_PANEL', payload: 'calendar' })
    else if (id === 'wbs') dispatch({ type: 'SET_PANEL', payload: 'wbs' })
    else if (id === 'analytics') dispatch({ type: 'SET_PANEL', payload: 'analytics' })
    else if (id === 'team') dispatch({ type: 'SET_PANEL', payload: 'team' })
    else dispatch({ type: 'SET_PANEL', payload: 'both' })
  }

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: state.sidebarOpen ? 0 : -70, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: state.sidebarOpen ? '240px' : '70px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: tokens.colors.bg.secondary,
        borderRight: `1px solid ${tokens.colors.border.subtle}`,
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: tokens.shadow.md,
        }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        <AnimatePresence>
          {state.sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: tokens.colors.text.primary, letterSpacing: '-0.3px' }}>Lumina</div>
              <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginTop: 1 }}>AI Calendar</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add Button */}
      <div style={{ padding: '12px 10px' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL' })}
          style={{
            width: '100%',
            padding: state.sidebarOpen ? '9px 14px' : '9px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: tokens.shadow.sm,
          }}
        >
          <Plus size={16} />
          {state.sidebarOpen && <span>新規作成</span>}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeNav === id
          return (
            <motion.button
              key={id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavClick(id)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: isActive
                  ? 'rgba(26,115,232,0.12)'
                  : 'transparent',
                color: isActive ? tokens.colors.accent.blue : tokens.colors.text.secondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} />
              <AnimatePresence>
                {state.sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </nav>

      {/* Projects */}
      <AnimatePresence>
        {state.sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '12px 10px',
              borderTop: `1px solid ${tokens.colors.border.subtle}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, padding: '0 4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              プロジェクト
            </div>
            {state.projects.map(proj => (
              <motion.button
                key={proj.id}
                whileHover={{ x: 2 }}
                onClick={() => dispatch({ type: 'SELECT_PROJECT', payload: proj.id })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: state.selectedProjectId === proj.id ? 'rgba(0,0,0,0.06)' : 'transparent',
                  color: tokens.colors.text.secondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5,
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.title}</span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  color: tokens.colors.text.tertiary,
                  background: 'rgba(0,0,0,0.06)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}>{proj.progress}%</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom */}
      <div style={{
        padding: '12px 10px',
        borderTop: `1px solid ${tokens.colors.border.subtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {[
          { icon: Bell, label: '通知', badge: 3, action: 'OPEN_NOTIFICATIONS' as const },
          { icon: Settings, label: '設定', action: 'OPEN_SETTINGS' as const },
        ].map(({ icon: Icon, label, badge = 0, action }) => (
          <motion.button
            key={label}
            whileHover={{ x: 2 }}
            onClick={() => dispatch({ type: action })}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: tokens.colors.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              textAlign: 'left',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={18} />
              {badge && (
                <div style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: tokens.colors.accent.red,
                  fontSize: 9,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>{badge}</div>
              )}
            </div>
            <AnimatePresence>
              {state.sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}

        {/* Avatar */}
        <div style={{
          padding: '8px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
          }}>田</div>
          <AnimatePresence>
            {state.sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: tokens.colors.text.primary }}>田中 太郎</div>
                <div style={{ fontSize: 11, color: tokens.colors.text.tertiary }}>Pro プラン</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
