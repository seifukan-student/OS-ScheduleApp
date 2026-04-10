import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Calendar, CheckSquare, Clock, Target, AlertCircle,
  PieChart, CalendarDays, TrendingUp, X,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, isWithinInterval, isThisMonth, addDays, isAfter } from 'date-fns'
import { isDueDateOverdue } from '../utils/dueDate'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { tokens, categoryLabels, statusLabels } from '../utils/design'

type AnalyticsDetail = 'week' | 'rate' | 'wbs' | 'overdue'

export const AnalyticsPanel: React.FC = () => {
  const { state } = useAppState()
  const [detail, setDetail] = useState<AnalyticsDetail | null>(null)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const lastWeekStart = addWeeks(weekStart, -1)
  const lastWeekEnd = addWeeks(weekEnd, -1)

  const thisWeekEvents = state.events.filter(e =>
    isWithinInterval(e.start, { start: weekStart, end: weekEnd })
  )
  const lastWeekEvents = state.events.filter(e =>
    isWithinInterval(e.start, { start: lastWeekStart, end: lastWeekEnd })
  )
  const thisMonthEvents = state.events.filter(e => isThisMonth(e.start))

  const allTasks = state.projects.flatMap(p => p.tasks.map(t => ({ ...t, projectTitle: p.title })))
  const totalTasks = allTasks.length
  const doneTasks = allTasks.filter(t => t.status === 'done').length
  const todoTasks = allTasks.filter(t => t.status === 'todo').length
  const inProgTasks = allTasks.filter(t => t.status === 'in_progress').length
  const blockedTasks = allTasks.filter(t => t.status === 'blocked').length
  const taskRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const overdueCount = allTasks.filter(
    t => t.dueDate && t.status !== 'done' && isDueDateOverdue(t.dueDate, now)
  ).length

  const projectsWithEvent = state.projects.filter(p => p.eventId).length
  const eventsWithWbs = state.events.filter(e => e.wbsId).length
  const wbsLinkRate = state.events.length > 0 ? Math.round((eventsWithWbs / state.events.length) * 100) : 0

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    state.events.forEach(e => {
      map[e.category] = (map[e.category] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [state.events])

  const weekTrend = lastWeekEvents.length > 0
    ? Math.round(((thisWeekEvents.length - lastWeekEvents.length) / lastWeekEvents.length) * 100)
    : (thisWeekEvents.length > 0 ? 100 : 0)

  const upcoming = useMemo(() => {
    const end = addDays(now, 7)
    return state.events
      .filter(e => isAfter(e.start, now) && !isAfter(e.start, end))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 8)
  }, [state.events, now])

  const dueThisWeek = useMemo(() => {
    return allTasks
      .filter(t => t.dueDate && t.status !== 'done' && isWithinInterval(t.dueDate, { start: weekStart, end: weekEnd }))
      .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))
      .slice(0, 10)
  }, [allTasks, weekStart, weekEnd])

  const statusSegments = [
    { key: 'done', count: doneTasks, color: tokens.colors.status.done, label: statusLabels.done },
    { key: 'in_progress', count: inProgTasks, color: tokens.colors.status.in_progress, label: statusLabels.in_progress },
    { key: 'todo', count: todoTasks, color: tokens.colors.status.todo, label: statusLabels.todo },
    { key: 'blocked', count: blockedTasks, color: tokens.colors.status.blocked, label: statusLabels.blocked },
  ].filter(s => s.count > 0 || totalTasks === 0)

  const thisWeekSorted = useMemo(
    () => [...thisWeekEvents].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [thisWeekEvents]
  )

  const overdueTasksList = useMemo(
    () =>
      allTasks.filter(
        t => t.dueDate && t.status !== 'done' && isDueDateOverdue(t.dueDate, now)
      ),
    [allTasks, now]
  )

  const wbsLinkedEvents = useMemo(() => state.events.filter(e => e.wbsId), [state.events])

  const detailTitles: Record<AnalyticsDetail, string> = {
    week: '今週の予定',
    rate: 'タスク完了の内訳',
    wbs: '予定と WBS の紐付き',
    overdue: '期限超過タスク',
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: `linear-gradient(165deg, ${tokens.colors.bg.secondary} 0%, ${tokens.colors.bg.primary} 35%)`,
    }}>
      <div style={{
        padding: '22px 26px',
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        background: tokens.colors.bg.secondary,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #9334e6, #ea4335)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(147,52,230,0.28)',
          }}>
            <BarChart3 size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: tokens.colors.text.primary, letterSpacing: '-0.03em' }}>
              分析
            </h1>
            <p style={{ fontSize: 13, color: tokens.colors.text.tertiary, marginTop: 4 }}>
              予定・タスクの状況をひと目で把握
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 32px' }} className="custom-scrollbar">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, boxShadow: tokens.shadow.md }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setDetail('week')}
            style={{
              padding: 18,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.sm,
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <Calendar size={22} color={tokens.colors.accent.blue} />
              {weekTrend !== 0 && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: weekTrend >= 0 ? tokens.colors.accent.green : tokens.colors.accent.red,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <TrendingUp size={14} style={{ transform: weekTrend < 0 ? 'scaleY(-1)' : undefined }} />
                  {weekTrend > 0 ? '+' : ''}{weekTrend}%
                </span>
              )}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: tokens.colors.text.primary, lineHeight: 1 }}>{thisWeekEvents.length}</div>
            <div style={{ fontSize: 14, color: tokens.colors.text.secondary, marginTop: 6, fontWeight: 600 }}>今週の予定</div>
            <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 4 }}>
              {format(weekStart, 'M/d', { locale: ja })} 〜 {format(weekEnd, 'M/d', { locale: ja })} · タップで一覧
            </div>
          </motion.button>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            whileHover={{ scale: 1.02, boxShadow: tokens.shadow.md }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setDetail('rate')}
            style={{
              padding: 18,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.sm,
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
            }}
          >
            <CheckSquare size={22} color={tokens.colors.accent.green} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 32, fontWeight: 800, color: tokens.colors.text.primary }}>{taskRate}%</div>
            <div style={{ fontSize: 14, color: tokens.colors.text.secondary, marginTop: 6, fontWeight: 600 }}>タスク完了率</div>
            <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 4 }}>{doneTasks} / {totalTasks} 件完了 · タップで内訳</div>
          </motion.button>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            whileHover={{ scale: 1.02, boxShadow: tokens.shadow.md }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setDetail('wbs')}
            style={{
              padding: 18,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.sm,
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
            }}
          >
            <Target size={22} color={tokens.colors.accent.purple} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 32, fontWeight: 800, color: tokens.colors.text.primary }}>{wbsLinkRate}%</div>
            <div style={{ fontSize: 14, color: tokens.colors.text.secondary, marginTop: 6, fontWeight: 600 }}>予定→WBS 連携</div>
            <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 4 }}>{eventsWithWbs} / {state.events.length} 件 · タップで一覧</div>
          </motion.button>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            whileHover={{ scale: 1.02, boxShadow: tokens.shadow.md }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setDetail('overdue')}
            style={{
              padding: 18,
              borderRadius: tokens.radius.xl,
              background: overdueCount > 0 ? `${tokens.colors.accent.red}08` : tokens.colors.bg.card,
              border: `1px solid ${overdueCount > 0 ? `${tokens.colors.accent.red}35` : tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.sm,
              cursor: 'pointer',
              textAlign: 'left',
              font: 'inherit',
            }}
          >
            <AlertCircle size={22} color={overdueCount > 0 ? tokens.colors.accent.red : tokens.colors.text.tertiary} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 32, fontWeight: 800, color: overdueCount > 0 ? tokens.colors.accent.red : tokens.colors.text.primary }}>{overdueCount}</div>
            <div style={{ fontSize: 14, color: tokens.colors.text.secondary, marginTop: 6, fontWeight: 600 }}>期限超過タスク</div>
            <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 4 }}>未完了かつ期限が今日より前 · タップで一覧</div>
          </motion.button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 18,
          marginBottom: 20,
        }}
        className="analytics-bento-grid"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: 22,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <PieChart size={20} color={tokens.colors.accent.indigo} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>タスクの内訳（ステータス）</h3>
            </div>
            {totalTasks === 0 ? (
              <div style={{ fontSize: 13, color: tokens.colors.text.tertiary }}>タスクがありません</div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  height: 14,
                  borderRadius: 99,
                  overflow: 'hidden',
                  marginBottom: 16,
                  background: tokens.colors.bg.tertiary,
                }}>
                  {statusSegments.map(s => (
                    <motion.div
                      key={s.key}
                      layout
                      title={`${s.label}: ${s.count}`}
                      style={{
                        width: `${(s.count / totalTasks) * 100}%`,
                        background: s.color,
                        minWidth: s.count > 0 ? 4 : 0,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { count: doneTasks, color: tokens.colors.status.done, label: statusLabels.done },
                    { count: inProgTasks, color: tokens.colors.status.in_progress, label: statusLabels.in_progress },
                    { count: todoTasks, color: tokens.colors.status.todo, label: statusLabels.todo },
                    { count: blockedTasks, color: tokens.colors.status.blocked, label: statusLabels.blocked },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 99, background: row.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: tokens.colors.text.secondary, flex: 1 }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.text.primary }}>{row.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            style={{
              padding: 22,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <CalendarDays size={20} color={tokens.colors.accent.blue} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>今月のサマリー</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['今月の予定', `${thisMonthEvents.length} 件`],
                ['プロジェクト', `${state.projects.length}`],
                ['WBSと紐づく予定', `${eventsWithWbs} 件`],
                ['プロジェクト（イベント起点）', `${projectsWithEvent}`],
              ].map(([k, v]) => (
                <li
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: tokens.colors.text.secondary }}>{k}</span>
                  <span style={{ fontWeight: 700, color: tokens.colors.text.primary }}>{v}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 18,
        }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{
              padding: 22,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Clock size={20} color={tokens.colors.accent.amber} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>7日以内の予定</h3>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 13, color: tokens.colors.text.tertiary }}>該当する予定はありません</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(ev => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: tokens.colors.bg.tertiary,
                      border: `1px solid ${tokens.colors.border.subtle}`,
                    }}
                  >
                    <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 99, background: ev.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginTop: 2 }}>
                        {format(ev.start, 'M月d日(E) HH:mm', { locale: ja })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              padding: 22,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <CheckSquare size={20} color={tokens.colors.accent.green} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>今週期限のタスク</h3>
            </div>
            {dueThisWeek.length === 0 ? (
              <div style={{ fontSize: 13, color: tokens.colors.text.tertiary }}>今週期限の未完了タスクはありません</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dueThisWeek.map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: tokens.colors.bg.tertiary,
                      border: `1px solid ${tokens.colors.border.subtle}`,
                    }}
                  >
                    <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginBottom: 2 }}>{t.projectTitle}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tokens.colors.text.primary }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: tokens.colors.accent.blue, marginTop: 4, fontWeight: 600 }}>
                      期限 {t.dueDate && format(t.dueDate, 'M/d(E)', { locale: ja })} · {statusLabels[t.status]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            style={{
              padding: 22,
              borderRadius: tokens.radius.xl,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              boxShadow: tokens.shadow.md,
              gridColumn: '1 / -1',
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.tertiary, marginBottom: 16 }}>カテゴリ別の予定</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byCategory.length === 0 ? (
                <div style={{ fontSize: 13, color: tokens.colors.text.tertiary }}>データがありません</div>
              ) : (
                byCategory.map(([cat, count]) => {
                  const pct = state.events.length > 0 ? Math.round((count / state.events.length) * 100) : 0
                  const label = categoryLabels[cat] || cat
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary }}>{label}</span>
                        <span style={{ fontSize: 13, color: tokens.colors.text.tertiary }}>{count} 件 · {pct}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 99, background: tokens.colors.bg.tertiary, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          style={{ height: '100%', borderRadius: 99, background: tokens.colors.gradient.blue }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .analytics-bento-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: tokens.colors.overlay,
              zIndex: 4000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 560,
                maxHeight: '82vh',
                borderRadius: 18,
                background: tokens.colors.bg.secondary,
                border: `1px solid ${tokens.colors.border.subtle}`,
                boxShadow: tokens.shadow.lg,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '16px 18px',
                borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: tokens.colors.text.primary }}>{detailTitles[detail]}</h2>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDetail(null)}
                  aria-label="閉じる"
                  style={{
                    padding: 8,
                    border: 'none',
                    background: tokens.colors.bg.tertiary,
                    borderRadius: 10,
                    cursor: 'pointer',
                    color: tokens.colors.text.secondary,
                    display: 'flex',
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>
              <div style={{ overflowY: 'auto', padding: 18 }} className="custom-scrollbar">
                {detail === 'week' && (
                  thisWeekSorted.length === 0 ? (
                    <p style={{ fontSize: 14, color: tokens.colors.text.tertiary }}>今週の予定はありません。</p>
                  ) : (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {thisWeekSorted.map(ev => (
                        <li
                          key={ev.id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: tokens.colors.bg.tertiary,
                            border: `1px solid ${tokens.colors.border.subtle}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                          }}
                        >
                          <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 99, background: ev.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>{ev.title}</div>
                            <div style={{ fontSize: 13, color: tokens.colors.text.tertiary, marginTop: 4 }}>
                              {format(ev.start, 'M月d日(E) HH:mm', { locale: ja })} 〜 {format(ev.end, 'HH:mm')}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                )}
                {detail === 'rate' && (
                  totalTasks === 0 ? (
                    <p style={{ fontSize: 14, color: tokens.colors.text.tertiary }}>タスクがありません。</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ fontSize: 14, color: tokens.colors.text.secondary, marginBottom: 4 }}>
                        完了 {doneTasks} / {totalTasks}（{taskRate}%）
                      </p>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {allTasks.map(t => (
                          <li
                            key={`${t.projectTitle}-${t.id}`}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 12,
                              background: tokens.colors.bg.tertiary,
                              fontSize: 14,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 8,
                              alignItems: 'baseline',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: tokens.colors.text.primary }}>{t.title}</span>
                            <span style={{ fontSize: 12, color: tokens.colors.text.tertiary }}>{t.projectTitle}</span>
                            <span style={{
                              marginLeft: 'auto',
                              fontSize: 12,
                              fontWeight: 700,
                              color: tokens.colors.status[t.status],
                            }}>
                              {statusLabels[t.status]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
                {detail === 'wbs' && (
                  wbsLinkedEvents.length === 0 ? (
                    <p style={{ fontSize: 14, color: tokens.colors.text.tertiary }}>WBS と紐づいている予定はありません。</p>
                  ) : (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {wbsLinkedEvents.map(ev => {
                        const proj = state.projects.find(p => p.id === ev.wbsId)
                        return (
                          <li
                            key={ev.id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: 12,
                              background: tokens.colors.bg.tertiary,
                              border: `1px solid ${tokens.colors.border.subtle}`,
                            }}
                          >
                            <div style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>{ev.title}</div>
                            <div style={{ fontSize: 13, color: tokens.colors.text.tertiary, marginTop: 4 }}>
                              紐づく WBS: {proj?.title || ev.wbsId}
                            </div>
                            <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 4 }}>
                              {format(ev.start, 'M月d日(E) HH:mm', { locale: ja })}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )
                )}
                {detail === 'overdue' && (
                  overdueTasksList.length === 0 ? (
                    <p style={{ fontSize: 14, color: tokens.colors.text.tertiary }}>期限超過のタスクはありません。</p>
                  ) : (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {overdueTasksList.map(t => (
                        <li
                          key={`${t.projectTitle}-${t.id}`}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: `${tokens.colors.accent.red}08`,
                            border: `1px solid ${tokens.colors.accent.red}30`,
                          }}
                        >
                          <div style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>{t.title}</div>
                          <div style={{ fontSize: 13, color: tokens.colors.text.secondary, marginTop: 4 }}>{t.projectTitle}</div>
                          <div style={{ fontSize: 13, color: tokens.colors.accent.red, marginTop: 6, fontWeight: 600 }}>
                            期限 {t.dueDate && format(t.dueDate, 'M/d(E)', { locale: ja })} · {statusLabels[t.status]}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
