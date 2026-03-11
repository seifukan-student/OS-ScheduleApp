import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, format, getHours, getMinutes,
  addHours, differenceInMinutes, addDays
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { CalendarEvent } from '../types'
import { tokens } from '../utils/design'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES = ['月', '火', '水', '木', '金', '土', '日']

const EventPill: React.FC<{ event: CalendarEvent; compact?: boolean; onClick?: () => void }> = ({ event, compact, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      background: `${event.color}20`,
      border: `1px solid ${event.color}40`,
      borderLeft: `3px solid ${event.color}`,
      borderRadius: 6,
      padding: compact ? '2px 6px' : '4px 8px',
      fontSize: compact ? 10.5 : 11.5,
      fontWeight: 500,
      color: event.color,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      backdropFilter: 'blur(4px)',
    }}
  >
    {event.title}
  </motion.div>
)

export const MonthView: React.FC = () => {
  const { state, dispatch } = useAppState()
  const { currentDate, events } = state

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const start = startOfWeek(monthStart, { weekStartsOn: 1 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(e.start, day)).slice(0, 3)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
        {DAY_NAMES.map((d, i) => (
          <div key={d} style={{
            padding: '10px 0',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: i >= 5 ? tokens.colors.accent.blue : tokens.colors.text.tertiary,
            letterSpacing: '0.5px',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${days.length / 7}, 1fr)`, overflow: 'hidden' }}>
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDay = isToday(day)
          const allEvents = events.filter(e => isSameDay(e.start, day))
          const extra = allEvents.length - 3

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.005 }}
              style={{
                borderRight: `1px solid ${tokens.colors.border.subtle}`,
                borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                padding: '6px',
                background: isTodayDay ? 'rgba(59,130,246,0.05)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minHeight: 0,
                overflow: 'hidden',
              }}
              whileHover={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12.5,
                  fontWeight: isTodayDay ? 700 : isCurrentMonth ? 400 : 300,
                  color: isTodayDay
                    ? '#fff'
                    : isCurrentMonth
                      ? tokens.colors.text.primary
                      : tokens.colors.text.tertiary,
                  background: isTodayDay ? tokens.colors.accent.blue : 'transparent',
                }}>
                  {format(day, 'd')}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                {dayEvents.map(evt => (
                  <EventPill
                    key={evt.id}
                    event={evt}
                    compact
                    onClick={() => dispatch({ type: 'SELECT_EVENT', payload: evt.id })}
                  />
                ))}
                {extra > 0 && (
                  <div style={{ fontSize: 10, color: tokens.colors.text.tertiary, paddingLeft: 4 }}>
                    +{extra} 件
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export const WeekView: React.FC = () => {
  const { state, dispatch } = useAppState()
  const { currentDate, events } = state
  const HOUR_HEIGHT = 60

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(e.start, day) && !e.allDay)

  const getEventStyle = (event: CalendarEvent) => {
    const startMins = getHours(event.start) * 60 + getMinutes(event.start)
    const endMins = getHours(event.end) * 60 + getMinutes(event.end)
    const duration = endMins - startMins
    return {
      top: (startMins / 60) * HOUR_HEIGHT,
      height: Math.max((duration / 60) * HOUR_HEIGHT, 24),
    }
  }

  const now = new Date()
  const nowTop = (getHours(now) * 60 + getMinutes(now)) / 60 * HOUR_HEIGHT

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '52px repeat(7, 1fr)',
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        flexShrink: 0,
      }}>
        <div style={{ borderRight: `1px solid ${tokens.colors.border.subtle}` }} />
        {weekDays.map((day, i) => (
          <div key={day.toISOString()} style={{
            padding: '10px 0',
            textAlign: 'center',
            borderRight: `1px solid ${tokens.colors.border.subtle}`,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: i >= 5 ? tokens.colors.accent.blue : tokens.colors.text.tertiary,
              marginBottom: 4,
            }}>
              {DAY_NAMES[i]}
            </div>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: isToday(day) ? 700 : 400,
              color: isToday(day) ? '#fff' : tokens.colors.text.primary,
              background: isToday(day) ? tokens.colors.accent.blue : 'transparent',
            }}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="custom-scrollbar">
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', minHeight: HOUR_HEIGHT * 24 }}>
          {/* Hours column */}
          <div style={{ borderRight: `1px solid ${tokens.colors.border.subtle}`, position: 'relative' }}>
            {HOURS.map(hour => (
              <div key={hour} style={{
                height: HOUR_HEIGHT,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                paddingRight: 8,
                paddingTop: 4,
                fontSize: 10.5,
                color: tokens.colors.text.tertiary,
              }}>
                {hour > 0 ? `${hour}:00` : ''}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, colIdx) => (
            <div key={day.toISOString()} style={{
              borderRight: `1px solid ${tokens.colors.border.subtle}`,
              position: 'relative',
              background: isToday(day) ? 'rgba(59,130,246,0.03)' : 'transparent',
            }}>
              {/* Hour lines */}
              {HOURS.map(hour => (
                <div key={hour} style={{
                  position: 'absolute',
                  top: hour * HOUR_HEIGHT,
                  left: 0, right: 0,
                  borderTop: `1px solid ${tokens.colors.border.subtle}`,
                }} />
              ))}

              {/* Now indicator */}
              {isToday(day) && (
                <div style={{
                  position: 'absolute',
                  top: nowTop,
                  left: -1, right: 0,
                  height: 2,
                  background: '#EF4444',
                  zIndex: 10,
                }}>
                  <div style={{
                    position: 'absolute',
                    left: -4,
                    top: -4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#EF4444',
                  }} />
                </div>
              )}

              {/* Events */}
              {getEventsForDay(day).map(event => {
                const { top, height } = getEventStyle(event)
                return (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.02, zIndex: 20 }}
                    onClick={() => dispatch({ type: 'SELECT_EVENT', payload: event.id })}
                    style={{
                      position: 'absolute',
                      top: top + 1,
                      left: 3,
                      right: 3,
                      height: height - 2,
                      background: `${event.color}20`,
                      border: `1px solid ${event.color}50`,
                      borderLeft: `3px solid ${event.color}`,
                      borderRadius: 7,
                      padding: '3px 6px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      backdropFilter: 'blur(4px)',
                      zIndex: 5,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: event.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </div>
                    {height > 36 && (
                      <div style={{ fontSize: 10, color: `${event.color}99`, marginTop: 1 }}>
                        {format(event.start, 'H:mm')} - {format(event.end, 'H:mm')}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const DayView: React.FC = () => {
  const { state, dispatch } = useAppState()
  const HOUR_HEIGHT = 70
  const dayEvents = state.events.filter(e => isSameDay(e.start, state.currentDate))
  const now = new Date()
  const nowTop = (getHours(now) * 60 + getMinutes(now)) / 60 * HOUR_HEIGHT

  const getEventStyle = (event: CalendarEvent) => {
    const startMins = getHours(event.start) * 60 + getMinutes(event.start)
    const endMins = getHours(event.end) * 60 + getMinutes(event.end)
    return {
      top: (startMins / 60) * HOUR_HEIGHT,
      height: Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 28),
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', minHeight: HOUR_HEIGHT * 24 }}>
          <div style={{ borderRight: `1px solid ${tokens.colors.border.subtle}` }}>
            {HOURS.map(hour => (
              <div key={hour} style={{
                height: HOUR_HEIGHT,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                paddingRight: 10, paddingTop: 4, fontSize: 11, color: tokens.colors.text.tertiary,
              }}>
                {hour > 0 ? `${hour}:00` : ''}
              </div>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            {HOURS.map(hour => (
              <div key={hour} style={{
                position: 'absolute', top: hour * HOUR_HEIGHT, left: 0, right: 0,
                borderTop: `1px solid ${tokens.colors.border.subtle}`,
              }} />
            ))}
            {isToday(state.currentDate) && (
              <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, height: 2, background: '#EF4444', zIndex: 10 }}>
                <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              </div>
            )}
            {dayEvents.map(event => {
              const { top, height } = getEventStyle(event)
              return (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => dispatch({ type: 'SELECT_EVENT', payload: event.id })}
                  style={{
                    position: 'absolute', top: top + 1, left: 8, right: 8, height: height - 2,
                    background: `${event.color}18`,
                    border: `1px solid ${event.color}40`,
                    borderLeft: `4px solid ${event.color}`,
                    borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: event.color }}>{event.title}</div>
                  <div style={{ fontSize: 11, color: `${event.color}99`, marginTop: 2 }}>
                    {format(event.start, 'H:mm')} - {format(event.end, 'H:mm')}
                    {event.location && ` · ${event.location}`}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AgendaView: React.FC = () => {
  const { state, dispatch } = useAppState()
  const upcoming = [...state.events]
    .filter(e => e.start >= new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 20)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scrollbar">
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {upcoming.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ x: 3 }}
            onClick={() => dispatch({ type: 'SELECT_EVENT', payload: event.id })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 12,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: `${event.color}20`,
              border: `1px solid ${event.color}40`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: event.color }}>{format(event.start, 'd')}</div>
              <div style={{ fontSize: 9, color: event.color, textTransform: 'uppercase' }}>{format(event.start, 'MMM', { locale: ja })}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.title}
              </div>
              <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 2 }}>
                {format(event.start, 'H:mm')} - {format(event.end, 'H:mm')}
                {event.location && ` · ${event.location}`}
              </div>
            </div>
            <div style={{
              padding: '3px 10px', borderRadius: 6,
              background: `${event.color}20`, color: event.color, fontSize: 11, fontWeight: 500,
            }}>
              {isToday(event.start) ? '今日' : format(event.start, 'M/d')}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
