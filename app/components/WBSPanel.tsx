import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight,
  Plus, Zap, CheckSquare, Pencil, Trash2, Filter, LayoutList, Table2, LayoutGrid,
} from 'lucide-react'
import { format } from 'date-fns'
import { isDueDateOverdue } from '../utils/dueDate'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { WBSTask, WBSProject, TaskStatus, Priority } from '../types'
import { tokens, statusLabels, priorityLabels } from '../utils/design'

const UI = {
  text: { sm: 13, md: 14, base: 15, lg: 16, title: 18 } as const,
}

const StatusIcon: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const color = tokens.colors.status[status]
  const s = 18
  if (status === 'done') return <CheckCircle2 size={s} color={color} />
  if (status === 'blocked') return <AlertTriangle size={s} color={color} />
  if (status === 'in_progress') return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      style={{ width: s, height: s, borderRadius: '50%', border: `2px solid ${color}`, borderTopColor: 'transparent' }}
    />
  )
  return <Circle size={s} color={color} />
}

const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({
  value, color = tokens.colors.accent.blue, height = 4
}) => (
  <div style={{
    width: '100%', height, borderRadius: height, background: 'rgba(0,0,0,0.08)', overflow: 'hidden'
  }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ height: '100%', borderRadius: height, background: color }}
    />
  </div>
)

const TaskRow: React.FC<{ task: WBSTask; projectId: string; depth?: number }> = ({
  task, projectId, depth = 0
}) => {
  const { state, dispatch } = useAppState()
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const [draftDesc, setDraftDesc] = useState(task.description || '')
  const [draftPriority, setDraftPriority] = useState<Priority>(task.priority)
  const [draftDue, setDraftDue] = useState(
    task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : ''
  )
  const [draftAssignee, setDraftAssignee] = useState(task.assignee || '')

  useEffect(() => {
    setDraftTitle(task.title)
    setDraftDesc(task.description || '')
    setDraftPriority(task.priority)
    setDraftDue(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '')
    setDraftAssignee(task.assignee || '')
  }, [task.id, task.title, task.description, task.priority, task.dueDate, task.assignee])

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next: TaskStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
    dispatch({ type: 'UPDATE_TASK', payload: { projectId, task: { ...task, status: next, progress: next === 'done' ? 100 : task.progress } } })
  }

  const saveTaskEdit = () => {
    const title = draftTitle.trim() || task.title
    let dueDate: Date | undefined
    if (draftDue.trim()) {
      const d = new Date(draftDue + 'T12:00:00')
      dueDate = Number.isNaN(d.getTime()) ? task.dueDate : d
    } else {
      dueDate = undefined
    }
    const assigneeTrim = draftAssignee.trim()
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        projectId,
        task: {
          ...task,
          title,
          description: draftDesc.trim() || undefined,
          priority: draftPriority,
          dueDate,
          assignee: assigneeTrim || undefined,
        },
      },
    })
    setEditing(false)
  }

  const deleteTask = () => {
    if (!confirm(`「${task.title}」を削除しますか？`)) return
    dispatch({ type: 'DELETE_TASK', payload: { projectId, taskId: task.id } })
  }

  const priorityColor = tokens.colors.priority[task.priority]
  const statusColor = tokens.colors.status[task.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ marginLeft: depth * 20 }}
    >
      <motion.div
        whileHover={{ background: 'rgba(0,0,0,0.04)' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'background 0.15s',
          borderLeft: depth > 0 ? `2px solid ${tokens.colors.border.default}` : 'none',
          marginLeft: depth > 0 ? 10 : 0,
        }}
      >
        {/* Status toggle */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleStatus}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <StatusIcon status={task.status} />
        </motion.button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: UI.text.base,
            fontWeight: 600,
            color: task.status === 'done' ? tokens.colors.text.tertiary : tokens.colors.text.primary,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: UI.text.sm, color: tokens.colors.text.tertiary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </div>
          )}
          {task.assignee && (
            <div style={{ fontSize: UI.text.sm, color: tokens.colors.accent.blue, marginTop: 4, fontWeight: 600 }}>
              担当: {task.assignee}
            </div>
          )}
        </div>

        {/* Progress */}
        {task.status === 'in_progress' && (
          <div style={{ width: 72 }}>
            <ProgressBar value={task.progress} height={4} />
            <div style={{ fontSize: UI.text.sm, color: tokens.colors.text.tertiary, textAlign: 'right', marginTop: 2 }}>{task.progress}%</div>
          </div>
        )}

        {/* Due date */}
        {task.dueDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: UI.text.sm,
            color: task.dueDate && task.status !== 'done' && isDueDateOverdue(task.dueDate)
              ? tokens.colors.accent.red
              : tokens.colors.text.tertiary,
            flexShrink: 0,
          }}>
            <Clock size={14} />
            {format(task.dueDate, 'M/d')}
          </div>
        )}

        {/* Priority badge */}
        <div style={{
          padding: '3px 9px',
          borderRadius: 6,
          fontSize: UI.text.sm,
          fontWeight: 600,
          color: priorityColor,
          background: `${priorityColor}18`,
          border: `1px solid ${priorityColor}30`,
          flexShrink: 0,
        }}>
          {priorityLabels[task.priority]}
        </div>

        {/* Status badge */}
        <div style={{
          padding: '3px 10px',
          borderRadius: 6,
          fontSize: UI.text.sm,
          fontWeight: 600,
          color: statusColor,
          background: `${statusColor}15`,
          flexShrink: 0,
        }}>
          {statusLabels[task.status]}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: `${tokens.colors.accent.purple}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: UI.text.sm, fontWeight: 700, color: tokens.colors.accent.purple,
            flexShrink: 0,
          }}>
            {task.assignee.charAt(0)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="編集"
            onClick={() => setEditing(v => !v)}
            style={{
              padding: 6,
              border: 'none',
              background: 'transparent',
              color: tokens.colors.text.tertiary,
              cursor: 'pointer',
              borderRadius: 8,
            }}
          >
            <Pencil size={16} />
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="削除"
            onClick={deleteTask}
            style={{
              padding: 6,
              border: 'none',
              background: 'transparent',
              color: tokens.colors.accent.red,
              cursor: 'pointer',
              borderRadius: 8,
            }}
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </motion.div>

      {editing && (
        <div
          style={{
            marginLeft: depth * 20 + 26,
            marginTop: 8,
            marginBottom: 8,
            padding: 12,
            borderRadius: 10,
            background: tokens.colors.bg.tertiary,
            border: `1px solid ${tokens.colors.border.subtle}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
          onClick={e => e.stopPropagation()}
        >
          <input
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            placeholder="タイトル"
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${tokens.colors.border.default}`,
              fontSize: 13,
              background: tokens.colors.bg.card,
              color: tokens.colors.text.primary,
            }}
          />
          <input
            value={draftDesc}
            onChange={e => setDraftDesc(e.target.value)}
            placeholder="説明（任意）"
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${tokens.colors.border.default}`,
              fontSize: 12,
              background: tokens.colors.bg.card,
              color: tokens.colors.text.primary,
            }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: tokens.colors.text.tertiary, display: 'flex', alignItems: 'center', gap: 6 }}>
              期限
              <input
                type="date"
                value={draftDue}
                onChange={e => setDraftDue(e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1px solid ${tokens.colors.border.default}`,
                  fontSize: 12,
                  background: tokens.colors.bg.card,
                  color: tokens.colors.text.primary,
                }}
              />
            </label>
            <label style={{ fontSize: 11, color: tokens.colors.text.tertiary, display: 'flex', alignItems: 'center', gap: 6 }}>
              優先度
              <select
                value={draftPriority}
                onChange={e => setDraftPriority(e.target.value as Priority)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1px solid ${tokens.colors.border.default}`,
                  fontSize: 12,
                  background: tokens.colors.bg.card,
                  color: tokens.colors.text.primary,
                }}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: tokens.colors.text.tertiary, display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
              担当
              <select
                value={draftAssignee}
                onChange={e => setDraftAssignee(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1px solid ${tokens.colors.border.default}`,
                  fontSize: 12,
                  background: tokens.colors.bg.card,
                  color: tokens.colors.text.primary,
                }}
              >
                <option value="">（なし）</option>
                {state.teamMembers.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveTaskEdit}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: tokens.colors.accent.blue,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              保存
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEditing(false)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid ${tokens.colors.border.default}`,
                background: tokens.colors.bg.card,
                color: tokens.colors.text.secondary,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              キャンセル
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

type TaskListFilter = 'all' | 'open' | 'overdue'
type WbsLayout = 'projects' | 'table' | 'board'

type FlatTaskRow = { task: WBSTask; projectId: string; projectTitle: string; projectColor: string }

function taskMatchesFilter(t: WBSTask, taskFilter: TaskListFilter): boolean {
  if (taskFilter === 'open') return t.status !== 'done'
  if (taskFilter === 'overdue') {
    return !!(t.dueDate && t.status !== 'done' && isDueDateOverdue(t.dueDate))
  }
  return true
}

function buildFlatRows(projects: WBSProject[], taskFilter: TaskListFilter): FlatTaskRow[] {
  const rows: FlatTaskRow[] = []
  projects.forEach(p => {
    p.tasks.forEach(t => {
      if (taskMatchesFilter(t, taskFilter)) {
        rows.push({ task: t, projectId: p.id, projectTitle: p.title, projectColor: p.color })
      }
    })
  })
  return rows.sort((a, b) => {
    const c = a.projectTitle.localeCompare(b.projectTitle, 'ja')
    if (c !== 0) return c
    const ad = a.task.dueDate?.getTime() ?? 0
    const bd = b.task.dueDate?.getTime() ?? 0
    return ad - bd
  })
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']

const TasksTableView: React.FC<{ rows: FlatTaskRow[] }> = ({ rows }) => {
  const { state, dispatch } = useAppState()

  const patch = (projectId: string, task: WBSTask, partial: Partial<WBSTask>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { projectId, task: { ...task, ...partial } } })
  }

  const del = (projectId: string, taskId: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return
    dispatch({ type: 'DELETE_TASK', payload: { projectId, taskId } })
  }

  return (
    <div style={{ borderRadius: tokens.radius.xl, border: `1px solid ${tokens.colors.border.subtle}`, background: tokens.colors.bg.card, overflow: 'hidden', boxShadow: tokens.shadow.sm }}>
      <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: UI.text.md }}>
          <thead>
            <tr style={{ background: tokens.colors.bg.tertiary, borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
              {['プロジェクト', 'タスク', 'ステータス', '優先度', '期限', '担当', ''].map((h, i) => (
                <th
                  key={h || 'op'}
                  style={{
                    textAlign: i === 1 ? 'left' : i === 6 ? 'right' : 'left',
                    padding: '14px 16px',
                    fontSize: UI.text.sm,
                    fontWeight: 700,
                    color: tokens.colors.text.tertiary,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ task, projectId, projectTitle, projectColor }) => (
              <tr key={`${projectId}-${task.id}`} style={{ borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
                <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 99, background: projectColor, minHeight: 28 }} />
                    <span style={{ fontSize: UI.text.md, fontWeight: 600, color: tokens.colors.text.primary }}>{projectTitle}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', minWidth: 200, verticalAlign: 'middle' }}>
                  <div style={{ fontSize: UI.text.base, fontWeight: 600, color: tokens.colors.text.primary }}>{task.title}</div>
                  {task.description && (
                    <div style={{ fontSize: UI.text.sm, color: tokens.colors.text.tertiary, marginTop: 4, maxWidth: 420 }}>{task.description}</div>
                  )}
                </td>
                <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                  <select
                    value={task.status}
                    onChange={e => patch(projectId, task, { status: e.target.value as TaskStatus, progress: e.target.value === 'done' ? 100 : task.progress })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${tokens.colors.border.default}`,
                      fontSize: UI.text.md,
                      fontWeight: 600,
                      background: tokens.colors.bg.secondary,
                      color: tokens.colors.text.primary,
                      minWidth: 120,
                    }}
                  >
                    {(['todo', 'in_progress', 'blocked', 'done'] as TaskStatus[]).map(s => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                  <select
                    value={task.priority}
                    onChange={e => patch(projectId, task, { priority: e.target.value as Priority })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${tokens.colors.border.default}`,
                      fontSize: UI.text.md,
                      background: tokens.colors.bg.secondary,
                      minWidth: 88,
                    }}
                  >
                    <option value="low">{priorityLabels.low}</option>
                    <option value="medium">{priorityLabels.medium}</option>
                    <option value="high">{priorityLabels.high}</option>
                  </select>
                </td>
                <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                  <input
                    type="date"
                    value={task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : ''}
                    onChange={e => {
                      const v = e.target.value
                      patch(projectId, task, { dueDate: v ? new Date(v + 'T12:00:00') : undefined })
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${tokens.colors.border.default}`,
                      fontSize: UI.text.md,
                      background: tokens.colors.bg.secondary,
                    }}
                  />
                </td>
                <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                  <select
                    value={task.assignee && state.teamMembers.some(m => m.name === task.assignee) ? task.assignee : ''}
                    onChange={e => patch(projectId, task, { assignee: e.target.value || undefined })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${tokens.colors.border.default}`,
                      fontSize: UI.text.md,
                      minWidth: 140,
                      maxWidth: 220,
                      background: tokens.colors.bg.secondary,
                      color: tokens.colors.text.primary,
                    }}
                  >
                    <option value="">未設定</option>
                    {state.teamMembers.map(m => (
                      <option key={m.id} value={m.name}>{m.name}{m.role ? `（${m.role}）` : ''}</option>
                    ))}
                  </select>
                  {task.assignee && !state.teamMembers.some(m => m.name === task.assignee) && (
                    <div style={{ fontSize: UI.text.sm, color: tokens.colors.accent.amber, marginTop: 4 }}>※チーム未登録: {task.assignee}</div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => del(projectId, task.id, task.title)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: `${tokens.colors.accent.red}14`,
                      color: tokens.colors.accent.red,
                      fontSize: UI.text.sm,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    削除
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', fontSize: UI.text.md, color: tokens.colors.text.tertiary }}>
          表示するタスクがありません。フィルターを変えるか、プロジェクトビューでタスクを追加してください。
        </div>
      )}
    </div>
  )
}

const TasksBoardView: React.FC<{ rows: FlatTaskRow[] }> = ({ rows }) => {
  const { state, dispatch } = useAppState()
  const patch = (projectId: string, task: WBSTask, partial: Partial<WBSTask>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { projectId, task: { ...task, ...partial } } })
  }

  const byStatus = useMemo(() => {
    const m: Record<TaskStatus, FlatTaskRow[]> = { todo: [], in_progress: [], blocked: [], done: [] }
    rows.forEach(r => {
      m[r.task.status].push(r)
    })
    return m
  }, [rows])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 14,
      alignItems: 'stretch',
    }}
    >
      {STATUS_ORDER.map(st => (
        <div
          key={st}
          style={{
            borderRadius: tokens.radius.xl,
            background: tokens.colors.bg.tertiary,
            border: `1px solid ${tokens.colors.border.subtle}`,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 280,
            maxHeight: 'calc(100vh - 220px)',
          }}
        >
          <div style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${tokens.colors.border.subtle}`,
            background: tokens.colors.bg.secondary,
            fontSize: UI.text.md,
            fontWeight: 800,
            color: tokens.colors.status[st],
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{statusLabels[st]}</span>
            <span style={{
              fontSize: UI.text.sm,
              background: `${tokens.colors.status[st]}18`,
              padding: '2px 10px',
              borderRadius: 99,
            }}
            >
              {byStatus[st].length}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }} className="custom-scrollbar">
            {byStatus[st].map(({ task, projectId, projectTitle, projectColor }) => (
              <div
                key={task.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: tokens.colors.bg.card,
                  border: `1px solid ${tokens.colors.border.subtle}`,
                  boxShadow: tokens.shadow.sm,
                }}
              >
                <div style={{ fontSize: UI.text.sm, color: tokens.colors.text.tertiary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: projectColor }} />
                  {projectTitle}
                </div>
                <div style={{ fontSize: UI.text.base, fontWeight: 700, color: tokens.colors.text.primary, lineHeight: 1.4 }}>{task.title}</div>
                {task.dueDate && (
                  <div style={{ fontSize: UI.text.sm, color: tokens.colors.text.tertiary, marginTop: 8 }}>
                    期限 {format(task.dueDate, 'M/d(E)', { locale: ja })}
                  </div>
                )}
                <label style={{ display: 'block', marginTop: 10, fontSize: UI.text.sm, fontWeight: 600, color: tokens.colors.text.secondary }}>
                  担当
                  <select
                    value={task.assignee && state.teamMembers.some(m => m.name === task.assignee) ? task.assignee : ''}
                    onChange={e => patch(projectId, task, { assignee: e.target.value || undefined })}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${tokens.colors.border.default}`,
                      fontSize: UI.text.md,
                      background: tokens.colors.bg.secondary,
                    }}
                  >
                    <option value="">未設定</option>
                    {state.teamMembers.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </label>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STATUS_ORDER.filter(s => s !== task.status).map(s => (
                    <motion.button
                      key={s}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => patch(projectId, task, { status: s, progress: s === 'done' ? 100 : task.progress })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: `1px solid ${tokens.colors.border.default}`,
                        background: tokens.colors.bg.secondary,
                        fontSize: UI.text.sm,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      →{statusLabels[s]}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
            {byStatus[st].length === 0 && (
              <div style={{ fontSize: UI.text.sm, color: tokens.colors.text.tertiary, textAlign: 'center', padding: 16 }}>
                なし
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const ProjectCard: React.FC<{ project: WBSProject; defaultExpanded?: boolean; taskFilter?: TaskListFilter }> = ({
  project, defaultExpanded = true, taskFilter = 'all',
}) => {
  const { dispatch } = useAppState()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingProject, setEditingProject] = useState(false)
  const [pTitle, setPTitle] = useState(project.title)
  const [pDesc, setPDesc] = useState(project.description || '')

  useEffect(() => {
    setPTitle(project.title)
    setPDesc(project.description || '')
  }, [project.id, project.title, project.description])

  const handleAddTask = () => {
    const title = newTaskTitle.trim()
    if (!title) return
    dispatch({
      type: 'ADD_TASK',
      payload: {
        projectId: project.id,
        task: {
          id: `task-${Date.now()}`,
          title,
          status: 'todo',
          priority: 'medium',
          progress: 0,
        },
      },
    })
    setNewTaskTitle('')
    setAddingTask(false)
  }

  const saveProjectMeta = () => {
    const title = pTitle.trim() || project.title
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        ...project,
        title,
        description: pDesc.trim() || undefined,
        updatedAt: new Date(),
      },
    })
    setEditingProject(false)
  }

  const deleteProject = () => {
    if (!confirm(`プロジェクト「${project.title}」とそのタスクをすべて削除しますか？`)) return
    dispatch({ type: 'DELETE_PROJECT', payload: project.id })
  }

  const completedTasks = project.tasks.filter(t => t.status === 'done').length
  const inProgress = project.tasks.filter(t => t.status === 'in_progress').length
  const blocked = project.tasks.filter(t => t.status === 'blocked').length

  const visibleTasks = useMemo(() => {
    return project.tasks.filter(t => {
      if (taskFilter === 'open') return t.status !== 'done'
      if (taskFilter === 'overdue') {
        return !!(t.dueDate && t.status !== 'done' && isDueDateOverdue(t.dueDate))
      }
      return true
    })
  }, [project.tasks, taskFilter])

  return (
    <motion.div
      layout
      style={{
        background: tokens.colors.bg.card,
        border: `1px solid ${tokens.colors.border.subtle}`,
        borderRadius: tokens.radius.xl,
        overflow: 'hidden',
        marginBottom: 14,
        boxShadow: tokens.shadow.md,
        borderLeft: `4px solid ${project.color}`,
      }}
    >
      {/* Project Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 18px',
          cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${tokens.colors.border.subtle}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: project.color, flexShrink: 0,
            boxShadow: `0 0 8px ${project.color}60`,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h3 style={{ fontSize: UI.text.title, fontWeight: 800, color: tokens.colors.text.primary }}>
                {project.title}
              </h3>
              {project.dueDate && (
                <span style={{
                  fontSize: 11, color: tokens.colors.text.tertiary,
                  background: tokens.colors.bg.tertiary, padding: '2px 8px', borderRadius: 5,
                }}>
                  期限: {format(project.dueDate, 'M月d日')}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProgressBar value={project.progress} color={project.color} height={5} />
              <span style={{ fontSize: 12, fontWeight: 600, color: project.color, flexShrink: 0 }}>
                {project.progress}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.status.done }}>{completedTasks}</div>
              <div style={{ fontSize: 10, color: tokens.colors.text.tertiary }}>完了</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.status.in_progress }}>{inProgress}</div>
              <div style={{ fontSize: 10, color: tokens.colors.text.tertiary }}>進行中</div>
            </div>
            {blocked > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.status.blocked }}>{blocked}</div>
                <div style={{ fontSize: 10, color: tokens.colors.text.tertiary }}>ブロック</div>
              </div>
            )}
            <div style={{ width: 1, height: 30, background: tokens.colors.border.subtle }} />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 2 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="プロジェクトを編集"
                onClick={() => {
                  setEditingProject(v => !v)
                  setExpanded(true)
                }}
                style={{
                  padding: 8,
                  border: 'none',
                  background: 'transparent',
                  color: tokens.colors.text.tertiary,
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                <Pencil size={16} />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="プロジェクトを削除"
                onClick={deleteProject}
                style={{
                  padding: 8,
                  border: 'none',
                  background: 'transparent',
                  color: tokens.colors.accent.red,
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                <Trash2 size={16} />
              </motion.button>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              style={{ color: tokens.colors.text.tertiary }}
            >
              <ChevronRight size={18} />
            </motion.div>
          </div>
        </div>
      </div>

      {editingProject && (
        <div
          style={{
            padding: '12px 18px',
            borderBottom: `1px solid ${tokens.colors.border.subtle}`,
            background: tokens.colors.bg.tertiary,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          onClick={e => e.stopPropagation()}
        >
          <input
            value={pTitle}
            onChange={e => setPTitle(e.target.value)}
            placeholder="プロジェクト名"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${tokens.colors.border.default}`,
              fontSize: 14,
              fontWeight: 600,
              background: tokens.colors.bg.card,
              color: tokens.colors.text.primary,
            }}
          />
          <textarea
            value={pDesc}
            onChange={e => setPDesc(e.target.value)}
            placeholder="説明（任意）"
            rows={2}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${tokens.colors.border.default}`,
              fontSize: 13,
              resize: 'vertical',
              background: tokens.colors.bg.card,
              color: tokens.colors.text.primary,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveProjectMeta}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                background: tokens.colors.accent.blue,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              保存
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEditingProject(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: `1px solid ${tokens.colors.border.default}`,
                background: tokens.colors.bg.card,
                color: tokens.colors.text.secondary,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              キャンセル
            </motion.button>
          </div>
        </div>
      )}

      {/* Tasks */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '8px 12px 12px' }}>
              {/* Column headers */}
              <div style={{
                display: 'flex', gap: 10, padding: '4px 12px 8px',
                borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                marginBottom: 4,
              }}>
                <div style={{ flex: 1, fontSize: UI.text.sm, color: tokens.colors.text.tertiary, fontWeight: 700 }}>タスク名</div>
                <div style={{ width: 68, fontSize: UI.text.sm, color: tokens.colors.text.tertiary, fontWeight: 700 }}>進捗</div>
                <div style={{ width: 56, fontSize: UI.text.sm, color: tokens.colors.text.tertiary, fontWeight: 700 }}>期限</div>
                <div style={{ width: 44, fontSize: UI.text.sm, color: tokens.colors.text.tertiary, fontWeight: 700 }}>優先</div>
                <div style={{ width: 56, fontSize: UI.text.sm, color: tokens.colors.text.tertiary, fontWeight: 700 }}>ステータス</div>
                <div style={{ width: 56, fontSize: UI.text.sm, color: tokens.colors.text.tertiary, fontWeight: 700 }}>操作</div>
              </div>

              {visibleTasks.length === 0 && project.tasks.length > 0 && (
                <div style={{ padding: '16px 12px', fontSize: 12, color: tokens.colors.text.tertiary, textAlign: 'center' }}>
                  この表示条件に一致するタスクはありません
                </div>
              )}
              {visibleTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <TaskRow task={task} projectId={project.id} />
                </motion.div>
              ))}

              {/* Add task */}
              {addingTask ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') setAddingTask(false) }}
                    placeholder="タスク名"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${tokens.colors.border.default}`,
                      background: tokens.colors.bg.card,
                      color: tokens.colors.text.primary,
                      fontSize: 13,
                    }}
                  />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddTask} disabled={!newTaskTitle.trim()} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: tokens.colors.accent.blue, color: '#fff', cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}>
                    追加
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setAddingTask(false); setNewTaskTitle('') }} style={{ padding: 8, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer', fontSize: 12 }}>
                    キャンセル
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => setAddingTask(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8, border: 'none',
                    background: 'transparent', color: tokens.colors.text.tertiary,
                    cursor: 'pointer', fontSize: 12, marginTop: 4,
                    width: '100%',
                  }}
                >
                  <Plus size={14} />
                  タスクを追加
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const layoutTabs: { id: WbsLayout; label: string; icon: React.ReactNode }[] = [
  { id: 'projects', label: 'プロジェクト', icon: <LayoutList size={17} /> },
  { id: 'table', label: 'テーブル', icon: <Table2 size={17} /> },
  { id: 'board', label: 'ボード', icon: <LayoutGrid size={17} /> },
]

export const WBSPanel: React.FC = () => {
  const { state, dispatch } = useAppState()
  const [taskFilter, setTaskFilter] = useState<TaskListFilter>('all')
  const [wbsLayout, setWbsLayout] = useState<WbsLayout>('projects')

  const flatRows = useMemo(() => buildFlatRows(state.projects, taskFilter), [state.projects, taskFilter])

  const totalTasks = state.projects.reduce((acc, p) => acc + p.tasks.length, 0)
  const doneTasks = state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'done').length, 0)
  const inProgressTasks = state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'in_progress').length, 0)
  const blockedTasks = state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'blocked').length, 0)
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const filterPills: { id: TaskListFilter; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'open', label: '未完了' },
    { id: 'overdue', label: '期限超過' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: `linear-gradient(180deg, ${tokens.colors.bg.secondary} 0%, ${tokens.colors.bg.primary} 28%)`,
    }}>
      <div style={{
        padding: '20px 22px 16px',
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        background: tokens.colors.bg.secondary,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #137333, #1a73e8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(26,115,232,0.25)',
          }}>
            <LayoutList size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: tokens.colors.text.primary, letterSpacing: '-0.02em' }}>
              タスク
            </h2>
            <p style={{ fontSize: UI.text.md, color: tokens.colors.text.secondary, marginTop: 6, fontWeight: 500 }}>
              {state.projects.length} プロジェクト · {totalTasks} タスク · 完了 {pct}%
            </p>
            <div style={{
              marginTop: 10,
              height: 6,
              borderRadius: 99,
              background: tokens.colors.bg.tertiary,
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #137333, #1a73e8)' }}
              />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL', payload: { mode: 'wbs' } })}
            style={{
              padding: '10px 16px', borderRadius: 12,
              background: tokens.colors.gradient.blue,
              border: 'none', color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: tokens.shadow.md,
              flexShrink: 0,
            }}
          >
            <Zap size={17} />
            AIでWBS
          </motion.button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: UI.text.sm, fontWeight: 700, color: tokens.colors.text.tertiary }}>ビュー</span>
          <div
            role="tablist"
            style={{
              display: 'inline-flex',
              padding: 4,
              borderRadius: 12,
              background: tokens.colors.bg.tertiary,
              border: `1px solid ${tokens.colors.border.subtle}`,
              gap: 4,
            }}
          >
            {layoutTabs.map(tab => (
              <motion.button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={wbsLayout === tab.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setWbsLayout(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: UI.text.md,
                  fontWeight: 700,
                  background: wbsLayout === tab.id ? tokens.colors.bg.card : 'transparent',
                  color: wbsLayout === tab.id ? tokens.colors.accent.blue : tokens.colors.text.secondary,
                  boxShadow: wbsLayout === tab.id ? tokens.shadow.sm : 'none',
                }}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tokens.colors.text.secondary, fontSize: UI.text.md, fontWeight: 700 }}>
            <Filter size={16} />
            タスクの絞り込み
          </div>
          {filterPills.map(p => (
            <motion.button
              key={p.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setTaskFilter(p.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 99,
                border: `1px solid ${taskFilter === p.id ? tokens.colors.accent.blue : tokens.colors.border.default}`,
                background: taskFilter === p.id ? `${tokens.colors.accent.blue}12` : tokens.colors.bg.card,
                color: taskFilter === p.id ? tokens.colors.accent.blue : tokens.colors.text.secondary,
                fontSize: UI.text.md,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 10,
        padding: '12px 16px',
        overflowX: 'auto',
        flexShrink: 0,
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        background: tokens.colors.bg.secondary,
      }} className="custom-scrollbar">
        {[
          { label: '全タスク', value: totalTasks, color: tokens.colors.text.secondary },
          { label: '完了', value: doneTasks, color: tokens.colors.status.done },
          { label: '進行中', value: inProgressTasks, color: tokens.colors.status.in_progress },
          { label: 'ブロック', value: blockedTasks, color: tokens.colors.status.blocked },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: tokens.colors.bg.card,
              border: `1px solid ${tokens.colors.border.subtle}`,
              minWidth: 100,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: UI.text.sm, color: tokens.colors.text.secondary, fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 24px' }} className="custom-scrollbar">
        {state.projects.length === 0 && wbsLayout === 'projects' && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            borderRadius: tokens.radius.xl,
            background: tokens.colors.bg.card,
            border: `1px dashed ${tokens.colors.border.default}`,
            color: tokens.colors.text.tertiary,
            fontSize: UI.text.md,
          }}>
            プロジェクトがありません。予定から WBS を作成するか、下のボタンから追加してください。
          </div>
        )}

        {wbsLayout === 'table' && <TasksTableView rows={flatRows} />}

        {wbsLayout === 'board' && <TasksBoardView rows={flatRows} />}

        {wbsLayout === 'projects' && state.projects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <ProjectCard project={project} defaultExpanded={idx === 0} taskFilter={taskFilter} />
          </motion.div>
        ))}

        {wbsLayout === 'projects' && (
          <motion.button
            whileHover={{ scale: 1.005, borderColor: tokens.colors.accent.blue }}
            whileTap={{ scale: 0.995 }}
            onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL' })}
            style={{
              width: '100%', padding: '18px',
              marginTop: 4,
              borderRadius: tokens.radius.xl,
              border: `2px dashed ${tokens.colors.border.default}`,
              background: tokens.colors.bg.card,
              color: tokens.colors.text.secondary,
              cursor: 'pointer',
              fontSize: UI.text.md,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Plus size={20} />
            プロジェクトを追加
          </motion.button>
        )}
      </div>
    </div>
  )
}
