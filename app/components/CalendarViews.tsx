import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, format, getHours, getMinutes,
  addHours, differenceInMinutes, addDays
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { CalendarEvent, WBSTask, WBSProject } from '../types'
import { tokens } from '../utils/design'
import { isDueDateOverdue } from '../utils/dueDate'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_NAMES = ['月', '火', '水', '木', '金', '土', '日']

type DueTaskRow = { task: WBSTask; projectId: string; color: string }

function buildDueTasksForDay(projects: WBSProject[], day: Date): DueTaskRow[] {
  const rows: DueTaskRow[] = []
  for (const p of projects) {
    for (const t of p.tasks) {
      if (t.status === 'done' || !t.dueDate) continue
      if (isSameDay(t.dueDate, day)) rows.push({ task: t, projectId: p.id, color: p.color })
    }
  }
  return rows.sort((a, b) => a.task.title.localeCompare(b.task.title, 'ja'))
}

const EventPill: React.FC<{ event: CalendarEvent; compact?: boolean; onClick?: (e?: React.MouseEvent) => void }> = ({ event, compact, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
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
  const { currentDate, events, projects } = state

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
          const dueTasksDay = buildDueTasksForDay(projects, day)
          const dayTaskChips = dueTasksDay.slice(0, 2)
          const taskExtra = dueTasksDay.length - dayTaskChips.length
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
              onClick={() => dispatch({
                type: 'OPEN_CREATE_MODAL',
                payload: { mode: 'event', initialDateTime: { date: format(day, 'yyyy-MM-dd'), start: '10:00', end: '11:00' } },
              })}
              style={{
                borderRight: `1px solid ${tokens.colors.border.subtle}`,
                borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                padding: '6px',
                background: isTodayDay ? 'rgba(26,115,232,0.08)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minHeight: 0,
                overflow: 'hidden',
              }}
              whileHover={{ background: 'rgba(0,0,0,0.04)' }}
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
                  boxShadow: isTodayDay ? tokens.shadow.sm : 'none',
                }}>
                  {format(day, 'd')}
                </div>
              </div>

              {dueTasksDay.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 2 }}>
                  {dayTaskChips.map(({ task, projectId, color }) => (
                    <motion.div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'SELECT_PROJECT', payload: projectId })
                        dispatch({ type: 'SET_PANEL', payload: 'both' })
                      }}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: `${color}14`,
                        border: `1px solid ${color}38`,
                        borderLeft: `2px solid ${task.dueDate && isDueDateOverdue(task.dueDate) ? tokens.colors.accent.red : color}`,
                        color: task.dueDate && isDueDateOverdue(task.dueDate) ? tokens.colors.accent.red : color,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      {task.title}
                    </motion.div>
                  ))}
                  {taskExtra > 0 && (
                    <div style={{ fontSize: 9, color: tokens.colors.text.tertiary, paddingLeft: 2 }}>
                      +{taskExtra} タスク
                    </div>
                  )}
                </div>
              )}

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
  const { currentDate, events, projects } = state
  const HOUR_HEIGHT = 60

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(e.start, day) && !e.allDay)

  const getAllDayEventsForDay = (day: Date) =>
    events.filter(e => e.allDay && isSameDay(e.start, day))

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

      {/* 終日予定 + 期限タスク（Google カレンダーの終日帯のようにタイムグリッド直上） */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52px repeat(7, 1fr)',
          borderBottom: `1px solid ${tokens.colors.border.subtle}`,
          flexShrink: 0,
          background: tokens.colors.bg.card,
          maxHeight: 120,
        }}
      >
        <div
          style={{
            borderRight: `1px solid ${tokens.colors.border.subtle}`,
            padding: '8px 4px',
            fontSize: 9,
            fontWeight: 700,
            color: tokens.colors.text.tertiary,
            lineHeight: 1.25,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          終日・
          <br />
          期限
        </div>
        {weekDays.map(day => {
          const allDayList = getAllDayEventsForDay(day)
          const dueList = buildDueTasksForDay(projects, day)
          return (
            <div
              key={`strip-${day.toISOString()}`}
              style={{
                borderRight: `1px solid ${tokens.colors.border.subtle}`,
                padding: 4,
                minHeight: 36,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
              className="custom-scrollbar"
            >
              {allDayList.map(ev => (
                <motion.div
                  key={ev.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={e => {
                    e.stopPropagation()
                    dispatch({ type: 'SELECT_EVENT', payload: ev.id })
                  }}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 5,
                    background: `${ev.color}22`,
                    border: `1px solid ${ev.color}44`,
                    borderLeft: `3px solid ${ev.color}`,
                    color: ev.color,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {ev.title}
                </motion.div>
              ))}
              {dueList.map(({ task, projectId, color }) => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={e => {
                    e.stopPropagation()
                    dispatch({ type: 'SELECT_PROJECT', payload: projectId })
                    dispatch({ type: 'SET_PANEL', payload: 'both' })
                  }}
                  title={`${task.title}（期限）`}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 5,
                    background: `${color}18`,
                    border: `1px solid ${color}40`,
                    borderLeft: `3px solid ${task.dueDate && isDueDateOverdue(task.dueDate) ? tokens.colors.accent.red : color}`,
                    color: task.dueDate && isDueDateOverdue(task.dueDate) ? tokens.colors.accent.red : color,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {task.title}
                </motion.div>
              ))}
            </div>
          )
        })}
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
              background: isToday(day) ? 'rgba(26,115,232,0.06)' : 'transparent',
            }}>
              {/* Clickable hour slots (empty area -> add event) */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  onClick={() => dispatch({
                    type: 'OPEN_CREATE_MODAL',
                    payload: {
                      mode: 'event',
                      initialDateTime: {
                        date: format(day, 'yyyy-MM-dd'),
                        start: `${hour.toString().padStart(2, '0')}:00`,
                        end: `${Math.min(hour + 1, 23).toString().padStart(2, '0')}:00`,
                      },
                    },
                  })}
                  style={{
                    position: 'absolute',
                    top: hour * HOUR_HEIGHT,
                    left: 0,
                    right: 0,
                    height: HOUR_HEIGHT,
                    cursor: 'pointer',
                  }}
                />
              ))}
              {/* Hour lines */}
              {HOURS.map(hour => (
                <div key={`line-${hour}`} style={{
                  position: 'absolute',
                  top: hour * HOUR_HEIGHT,
                  left: 0, right: 0,
                  borderTop: `1px solid ${tokens.colors.border.subtle}`,
                  pointerEvents: 'none',
                }} />
              ))}

              {/* Now indicator */}
              {isToday(day) && (
                <div style={{
                  position: 'absolute',
                  top: nowTop,
                  left: -1, right: 0,
                  height: 2,
                  background: tokens.colors.accent.red,
                  zIndex: 10,
                }}>
                  <div style={{
                    position: 'absolute',
                    left: -4,
                    top: -4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: tokens.colors.accent.red,
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
  const day = state.currentDate
  const allDayEvents = state.events.filter(e => e.allDay && isSameDay(e.start, day))
  const timedEvents = state.events.filter(e => !e.allDay && isSameDay(e.start, day))
  const dueList = buildDueTasksForDay(state.projects, day)
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr',
          borderBottom: `1px solid ${tokens.colors.border.subtle}`,
          flexShrink: 0,
          background: tokens.colors.bg.card,
          maxHeight: 120,
        }}
      >
        <div
          style={{
            padding: '10px 6px',
            fontSize: 9,
            fontWeight: 700,
            color: tokens.colors.text.tertiary,
            lineHeight: 1.25,
            borderRight: `1px solid ${tokens.colors.border.subtle}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          終日・
          <br />
          期限
        </div>
        <div
          style={{
            padding: 8,
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignContent: 'flex-start',
          }}
          className="custom-scrollbar"
        >
          {allDayEvents.map(ev => (
            <motion.div
              key={ev.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => dispatch({ type: 'SELECT_EVENT', payload: ev.id })}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
                background: `${ev.color}22`,
                border: `1px solid ${ev.color}44`,
                borderLeft: `3px solid ${ev.color}`,
                color: ev.color,
                cursor: 'pointer',
                maxWidth: '100%',
              }}
            >
              {ev.title}
            </motion.div>
          ))}
          {dueList.map(({ task, projectId, color }) => (
            <motion.div
              key={task.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                dispatch({ type: 'SELECT_PROJECT', payload: projectId })
                dispatch({ type: 'SET_PANEL', payload: 'both' })
              }}
              title={`${task.title}（期限）`}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
                background: `${color}18`,
                border: `1px solid ${color}40`,
                borderLeft: `3px solid ${task.dueDate && isDueDateOverdue(task.dueDate) ? tokens.colors.accent.red : color}`,
                color: task.dueDate && isDueDateOverdue(task.dueDate) ? tokens.colors.accent.red : color,
                cursor: 'pointer',
                maxWidth: '100%',
              }}
            >
              {task.title}
            </motion.div>
          ))}
        </div>
      </div>
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
              <div
                key={hour}
                onClick={() => dispatch({
                  type: 'OPEN_CREATE_MODAL',
                  payload: {
                    mode: 'event',
                    initialDateTime: {
                      date: format(state.currentDate, 'yyyy-MM-dd'),
                      start: `${hour.toString().padStart(2, '0')}:00`,
                      end: `${Math.min(hour + 1, 23).toString().padStart(2, '0')}:00`,
                    },
                  },
                })}
                style={{
                  position: 'absolute',
                  top: hour * HOUR_HEIGHT,
                  left: 0,
                  right: 0,
                  height: HOUR_HEIGHT,
                  cursor: 'pointer',
                }}
              />
            ))}
            {HOURS.map(hour => (
              <div key={`line-${hour}`} style={{
                position: 'absolute', top: hour * HOUR_HEIGHT, left: 0, right: 0,
                borderTop: `1px solid ${tokens.colors.border.subtle}`,
                pointerEvents: 'none',
              }} />
            ))}
            {isToday(state.currentDate) && (
              <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, height: 2, background: tokens.colors.accent.red, zIndex: 10 }}>
                <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: tokens.colors.accent.red }} />
              </div>
            )}
            {timedEvents.map(event => {
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
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL', payload: { mode: 'event' } })}
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            border: `2px dashed ${tokens.colors.border.default}`,
            background: 'transparent',
            color: tokens.colors.text.tertiary,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>+</span>
          予定を追加
        </motion.button>
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
