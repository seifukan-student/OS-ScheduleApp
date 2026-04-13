import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MapPin, ChevronRight,
  Calendar, Flag, Zap, Edit3, Trash2, Copy, Bell
} from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { CalendarEvent, WBSProject } from '../types'
import { tokens, categoryLabels, priorityLabels } from '../utils/design'
import { useBreakpoint } from '../hooks/useBreakpoint'

type EventDetailInnerProps = { event: CalendarEvent; project: WBSProject | null | undefined }

const EventDetailInner: React.FC<EventDetailInnerProps> = ({ event, project }) => {
  const { dispatch } = useAppState()
  return (
    <>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', background: `${event.color}12`, borderBottom: `1px solid ${tokens.colors.border.subtle}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ padding: '4px 10px', borderRadius: 6, background: `${event.color}20`, border: `1px solid ${event.color}40`, fontSize: 11, color: event.color, fontWeight: 600 }}>
            {categoryLabels[event.category]}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL', payload: { mode: 'event', editingEventId: event.id } })}
              style={{ padding: 8, borderRadius: 7, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }} title="編集">
              <Edit3 size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => dispatch({ type: 'OPEN_NOTIFICATIONS' })}
              style={{ padding: 8, borderRadius: 7, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}>
              <Bell size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => {
                const dup: CalendarEvent = { ...event, id: `evt-${Date.now()}`, title: `${event.title} (コピー)`, wbsId: undefined }
                dup.start = new Date(dup.start)
                dup.end = new Date(dup.end)
                dispatch({ type: 'ADD_EVENT', payload: dup })
              }}
              style={{ padding: 8, borderRadius: 7, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}>
              <Copy size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => dispatch({ type: 'SELECT_EVENT', payload: null })}
              style={{ padding: 8, borderRadius: 7, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}>
              <X size={16} />
            </motion.button>
          </div>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: tokens.colors.text.primary, lineHeight: 1.3, marginBottom: 8, letterSpacing: '-0.3px' }}>
          {event.title}
        </h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: `${tokens.colors.priority[event.priority]}15`, border: `1px solid ${tokens.colors.priority[event.priority]}30`, marginBottom: 14 }}>
          <Flag size={11} color={tokens.colors.priority[event.priority]} />
          <span style={{ fontSize: 11, color: tokens.colors.priority[event.priority], fontWeight: 600 }}>優先度: {priorityLabels[event.priority]}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="custom-scrollbar">
        {/* Time */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>日時</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${event.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color={event.color} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary }}>
                {format(event.start, 'M月d日(E) H:mm', { locale: ja })} - {format(event.end, 'H:mm')}
              </div>
              <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginTop: 2 }}>
                {differenceInMinutes(event.end, event.start)} 分間
                {event.recurring && event.recurring !== 'none' && <span style={{ marginLeft: 8, color: tokens.colors.accent.blue }}>↻ 繰り返し</span>}
              </div>
            </div>
          </div>
        </div>

        {event.description && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>説明</div>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}`, fontSize: 13, color: tokens.colors.text.secondary, lineHeight: 1.6 }}>
              {event.description}
            </div>
          </div>
        )}

        {event.location && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>場所</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}` }}>
              <MapPin size={16} color={tokens.colors.text.tertiary} />
              <span style={{ fontSize: 13, color: tokens.colors.text.secondary }}>{event.location}</span>
            </div>
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>参加者 ({event.attendees.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {event.attendees.map((attendee, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${i * 60}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {attendee.charAt(0)}
                  </div>
                  <span style={{ fontSize: 12.5, color: tokens.colors.text.secondary }}>{attendee}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>タグ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {event.tags.map(tag => (
                <span key={tag} style={{ padding: '3px 10px', borderRadius: 6, background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.default}`, fontSize: 11, color: tokens.colors.text.secondary }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {project && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>リンクプロジェクト</div>
            <motion.div whileTap={{ scale: 0.98 }} onClick={() => dispatch({ type: 'SELECT_PROJECT', payload: project.id })}
              style={{ padding: '12px 14px', borderRadius: 12, background: `${project.color}12`, border: `1px solid ${project.color}30`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary }}>{project.title}</div>
                <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginTop: 2 }}>{project.progress}% 完了</div>
              </div>
              <ChevronRight size={14} color={tokens.colors.text.tertiary} />
            </motion.div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${tokens.colors.border.subtle}`, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL', payload: { mode: 'wbs', preselectedEventId: event.id } })}
          style={{ padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: tokens.shadow.md }}>
          <Zap size={15} /> WBSを自動生成
        </motion.button>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button whileTap={{ scale: 0.98 }}
            onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL', payload: { mode: 'event', editingEventId: event.id } })}
            style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid ${tokens.colors.border.default}`, background: tokens.colors.bg.card, color: tokens.colors.text.secondary, cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Edit3 size={13} /> 編集
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!confirm('この予定を削除しますか？')) return
              dispatch({ type: 'REMOVE_EVENT', payload: event.id })
              dispatch({ type: 'SELECT_EVENT', payload: null })
            }}
            style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid rgba(239,68,68,0.3)`, background: 'rgba(217,48,37,0.1)', color: tokens.colors.accent.red, cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Trash2 size={13} /> 削除
          </motion.button>
        </div>
      </div>
    </>
  )
}

export const EventDetailPanel: React.FC = () => {
  const { state, dispatch } = useAppState()
  const isMobile = useBreakpoint(768)
  const event = state.events.find(e => e.id === state.selectedEventId)
  const project = event?.wbsId ? state.projects.find(p => p.id === event.wbsId) : null

  if (!state.selectedEventId || !event) return null

  if (isMobile) {
    return (
      <AnimatePresence>
        {event && (
          <>
            <motion.div key="eb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => dispatch({ type: 'SELECT_EVENT', payload: null })}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }}
            />
            <motion.div key="es"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                maxHeight: '85dvh',
                background: tokens.colors.bg.secondary,
                borderRadius: '20px 20px 0 0',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                zIndex: 410,
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: tokens.colors.border.default, margin: '12px auto 0', flexShrink: 0 }} />
              <EventDetailInner event={event} project={project} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: 360, height: '100%', background: tokens.colors.bg.secondary, borderLeft: `1px solid ${tokens.colors.border.subtle}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}
        >
          <EventDetailInner event={event} project={project} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
