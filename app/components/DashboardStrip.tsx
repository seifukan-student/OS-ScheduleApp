import React from 'react'
import { motion } from 'framer-motion'
import { format, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Clock, TrendingUp, Zap, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { useAppState } from '../store/AppContext'
import { tokens } from '../utils/design'

const CircularProgress: React.FC<{ value: number; color: string; size?: number }> = ({
  value, color, size = 56
}) => {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  )
}

export const DashboardStrip: React.FC = () => {
  const { state } = useAppState()

  const todayEvents = state.events.filter(e => isToday(e.start)).length
  const totalTasks = state.projects.reduce((a, p) => a + p.tasks.length, 0)
  const doneTasks = state.projects.reduce((a, p) => a + p.tasks.filter(t => t.status === 'done').length, 0)
  const blockedTasks = state.projects.reduce((a, p) => a + p.tasks.filter(t => t.status === 'blocked').length, 0)
  const avgProgress = state.projects.length > 0
    ? Math.round(state.projects.reduce((a, p) => a + p.progress, 0) / state.projects.length)
    : 0
  const nextEvent = state.events
    .filter(e => e.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0]

  const cards = [
    {
      label: '今日のイベント',
      value: todayEvents,
      unit: '件',
      icon: <Clock size={16} />,
      color: tokens.colors.accent.blue,
      sublabel: nextEvent ? `次: ${format(nextEvent.start, 'H:mm')} ${nextEvent.title}` : '予定なし',
    },
    {
      label: 'タスク完了率',
      value: Math.round((doneTasks / Math.max(totalTasks, 1)) * 100),
      unit: '%',
      icon: <CheckCircle size={16} />,
      color: tokens.colors.accent.green,
      sublabel: `${doneTasks} / ${totalTasks} 完了`,
      circular: true,
    },
    {
      label: 'プロジェクト進捗',
      value: avgProgress,
      unit: '%',
      icon: <TrendingUp size={16} />,
      color: tokens.colors.accent.purple,
      sublabel: `${state.projects.length} プロジェクト`,
      circular: true,
    },
    {
      label: 'ブロック中',
      value: blockedTasks,
      unit: '件',
      icon: <AlertCircle size={16} />,
      color: blockedTasks > 0 ? tokens.colors.accent.red : tokens.colors.accent.green,
      sublabel: blockedTasks > 0 ? '要対応' : 'すべて順調',
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 1,
      background: tokens.colors.border.subtle,
      borderBottom: `1px solid ${tokens.colors.border.subtle}`,
      flexShrink: 0,
    }}>
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
          whileHover={{ background: 'rgba(255,255,255,0.03)' }}
          style={{
            padding: '14px 18px',
            background: tokens.colors.bg.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {card.circular ? (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <CircularProgress value={card.value} color={card.color} size={52} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: card.color,
              }}>
                {card.value}
              </div>
            </div>
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${card.color}15`,
              border: `1px solid ${card.color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.color, flexShrink: 0,
            }}>
              {card.icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: card.color, letterSpacing: '-1px' }}>
                {card.value}
              </span>
              <span style={{ fontSize: 12, color: tokens.colors.text.tertiary }}>{card.unit}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.secondary }}>{card.label}</div>
            <div style={{ fontSize: 10, color: tokens.colors.text.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {card.sublabel}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
