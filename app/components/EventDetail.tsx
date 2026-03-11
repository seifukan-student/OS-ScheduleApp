import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Clock, MapPin, Users, Tag, ChevronRight, Link2, Star,
  Calendar, Flag, Zap, Edit3, Trash2, Copy, Bell, CheckSquare
} from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { tokens, categoryLabels, priorityLabels } from '../utils/design'

export const EventDetailPanel: React.FC = () => {
  const { state, dispatch } = useAppState()
  const event = state.events.find(e => e.id === state.selectedEventId)
  const project = event?.wbsId ? state.projects.find(p => p.id === event.wbsId) : null

  if (!state.selectedEventId) return null

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 360,
            height: '100%',
            background: tokens.colors.bg.secondary,
            borderLeft: `1px solid ${tokens.colors.border.subtle}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 16px 0',
            background: `${event.color}12`,
            borderBottom: `1px solid ${tokens.colors.border.subtle}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: `${event.color}20`,
                border: `1px solid ${event.color}40`,
                fontSize: 11,
                color: event.color,
                fontWeight: 600,
              }}>
                {categoryLabels[event.category]}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[Edit3, Bell, Copy].map((Icon, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}
                  >
                    <Icon size={15} />
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => dispatch({ type: 'SELECT_EVENT', payload: null })}
                  style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}
                >
                  <X size={15} />
                </motion.button>
              </div>
            </div>

            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: tokens.colors.text.primary,
              lineHeight: 1.3,
              marginBottom: 8,
              letterSpacing: '-0.3px',
            }}>
              {event.title}
            </h2>

            {/* Priority */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 6,
              background: `${tokens.colors.priority[event.priority]}15`,
              border: `1px solid ${tokens.colors.priority[event.priority]}30`,
              marginBottom: 14,
            }}>
              <Flag size={11} color={tokens.colors.priority[event.priority]} />
              <span style={{ fontSize: 11, color: tokens.colors.priority[event.priority], fontWeight: 600 }}>
                優先度: {priorityLabels[event.priority]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="custom-scrollbar">
            {/* Time */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                日時
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: tokens.colors.bg.card,
                border: `1px solid ${tokens.colors.border.subtle}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${event.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={18} color={event.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary }}>
                    {format(event.start, 'M月d日(E) H:mm', { locale: ja })} - {format(event.end, 'H:mm')}
                  </div>
                  <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginTop: 2 }}>
                    {differenceInMinutes(event.end, event.start)} 分間
                    {event.recurring && event.recurring !== 'none' && (
                      <span style={{ marginLeft: 8, color: tokens.colors.accent.blue }}>
                        ↻ 繰り返し
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  説明
                </div>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: tokens.colors.bg.card,
                  border: `1px solid ${tokens.colors.border.subtle}`,
                  fontSize: 13,
                  color: tokens.colors.text.secondary,
                  lineHeight: 1.6,
                }}>
                  {event.description}
                </div>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>場所</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 12,
                  background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}`,
                }}>
                  <MapPin size={16} color={tokens.colors.text.tertiary} />
                  <span style={{ fontSize: 13, color: tokens.colors.text.secondary }}>{event.location}</span>
                </div>
              </div>
            )}

            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  参加者 ({event.attendees.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {event.attendees.map((attendee, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px', borderRadius: 10,
                      background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.subtle}`,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `hsl(${i * 60}, 60%, 45%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {attendee.charAt(0)}
                      </div>
                      <span style={{ fontSize: 12.5, color: tokens.colors.text.secondary }}>{attendee}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>タグ</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {event.tags.map(tag => (
                    <span key={tag} style={{
                      padding: '3px 10px', borderRadius: 6,
                      background: tokens.colors.bg.card, border: `1px solid ${tokens.colors.border.default}`,
                      fontSize: 11, color: tokens.colors.text.secondary,
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Project */}
            {project && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: tokens.colors.text.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  リンクプロジェクト
                </div>
                <motion.div
                  whileHover={{ x: 3 }}
                  onClick={() => dispatch({ type: 'SELECT_PROJECT', payload: project.id })}
                  style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: `${project.color}12`,
                    border: `1px solid ${project.color}30`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
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
          <div style={{
            padding: '12px 16px',
            borderTop: `1px solid ${tokens.colors.border.subtle}`,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px', borderRadius: 12,
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                border: 'none', color: '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
              }}
            >
              <Zap size={15} />
              WBSを自動生成
            </motion.button>
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 10,
                  border: `1px solid ${tokens.colors.border.default}`,
                  background: tokens.colors.bg.card, color: tokens.colors.text.secondary,
                  cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Edit3 size={13} />
                編集
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => dispatch({ type: 'SELECT_EVENT', payload: null })}
                style={{
                  flex: 1, padding: '9px', borderRadius: 10,
                  border: `1px solid rgba(239,68,68,0.3)`,
                  background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                  cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Trash2 size={13} />
                削除
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
