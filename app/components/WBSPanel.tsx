import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, Clock, AlertTriangle, ChevronDown, ChevronRight,
  Plus, MoreHorizontal, Calendar, User, Flag, Layers, Target,
  TrendingUp, Zap, ArrowRight, CheckSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { useAppState } from '../store/AppContext'
import { WBSTask, WBSProject, TaskStatus, Priority } from '../types'
import { tokens, statusLabels, priorityLabels } from '../utils/design'

const StatusIcon: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const color = tokens.colors.status[status]
  if (status === 'done') return <CheckCircle2 size={16} color={color} />
  if (status === 'blocked') return <AlertTriangle size={16} color={color} />
  if (status === 'in_progress') return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${color}`, borderTopColor: 'transparent' }}
    />
  )
  return <Circle size={16} color={color} />
}

const ProgressBar: React.FC<{ value: number; color?: string; height?: number }> = ({
  value, color = tokens.colors.accent.blue, height = 4
}) => (
  <div style={{
    width: '100%', height, borderRadius: height, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
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
  const { dispatch } = useAppState()
  const [expanded, setExpanded] = useState(false)

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next: TaskStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
    dispatch({ type: 'UPDATE_TASK', payload: { projectId, task: { ...task, status: next, progress: next === 'done' ? 100 : task.progress } } })
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
        whileHover={{ background: 'rgba(255,255,255,0.04)' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
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
            fontSize: 13,
            fontWeight: 500,
            color: task.status === 'done' ? tokens.colors.text.tertiary : tokens.colors.text.primary,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </div>
          )}
        </div>

        {/* Progress */}
        {task.status === 'in_progress' && (
          <div style={{ width: 60 }}>
            <ProgressBar value={task.progress} height={3} />
            <div style={{ fontSize: 10, color: tokens.colors.text.tertiary, textAlign: 'right', marginTop: 2 }}>{task.progress}%</div>
          </div>
        )}

        {/* Due date */}
        {task.dueDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: task.dueDate < new Date() && task.status !== 'done'
              ? tokens.colors.accent.red
              : tokens.colors.text.tertiary,
            flexShrink: 0,
          }}>
            <Clock size={11} />
            {format(task.dueDate, 'M/d')}
          </div>
        )}

        {/* Priority badge */}
        <div style={{
          padding: '2px 7px',
          borderRadius: 5,
          fontSize: 10,
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
          padding: '2px 8px',
          borderRadius: 5,
          fontSize: 10,
          fontWeight: 500,
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
            fontSize: 10, fontWeight: 700, color: tokens.colors.accent.purple,
            flexShrink: 0,
          }}>
            {task.assignee.charAt(0)}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

const ProjectCard: React.FC<{ project: WBSProject; defaultExpanded?: boolean }> = ({
  project, defaultExpanded = true
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const completedTasks = project.tasks.filter(t => t.status === 'done').length
  const inProgress = project.tasks.filter(t => t.status === 'in_progress').length
  const blocked = project.tasks.filter(t => t.status === 'blocked').length

  return (
    <motion.div
      layout
      style={{
        background: tokens.colors.bg.card,
        border: `1px solid ${tokens.colors.border.subtle}`,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
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
              <h3 style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>
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
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              style={{ color: tokens.colors.text.tertiary }}
            >
              <ChevronRight size={18} />
            </motion.div>
          </div>
        </div>
      </div>

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
                <div style={{ flex: 1, fontSize: 11, color: tokens.colors.text.tertiary, fontWeight: 600 }}>タスク名</div>
                <div style={{ width: 60, fontSize: 11, color: tokens.colors.text.tertiary, fontWeight: 600 }}>進捗</div>
                <div style={{ width: 48, fontSize: 11, color: tokens.colors.text.tertiary, fontWeight: 600 }}>期限</div>
                <div style={{ width: 36, fontSize: 11, color: tokens.colors.text.tertiary, fontWeight: 600 }}>優先</div>
                <div style={{ width: 52, fontSize: 11, color: tokens.colors.text.tertiary, fontWeight: 600 }}>ステータス</div>
                <div style={{ width: 24 }} />
              </div>

              {project.tasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <TaskRow task={task} projectId={project.id} />
                </motion.div>
              ))}

              {/* Add task button */}
              <motion.button
                whileHover={{ x: 4 }}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const WBSPanel: React.FC = () => {
  const { state, dispatch } = useAppState()

  const totalTasks = state.projects.reduce((acc, p) => acc + p.tasks.length, 0)
  const doneTasks = state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'done').length, 0)
  const inProgressTasks = state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'in_progress').length, 0)
  const blockedTasks = state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'blocked').length, 0)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: tokens.colors.bg.primary,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: tokens.colors.bg.secondary,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #10B981, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckSquare size={16} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>WBS / タスク管理</h2>
          <p style={{ fontSize: 11, color: tokens.colors.text.tertiary }}>{totalTasks} タスク · {state.projects.length} プロジェクト</p>
        </div>
        <div style={{ flex: 1 }} />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '7px 14px', borderRadius: 9,
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            border: 'none', color: '#fff', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          }}
        >
          <Zap size={13} />
          AIで自動生成
        </motion.button>
      </div>

      {/* Stats Strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1, background: tokens.colors.border.subtle, flexShrink: 0,
      }}>
        {[
          { label: '全タスク', value: totalTasks, color: tokens.colors.text.secondary },
          { label: '完了', value: doneTasks, color: tokens.colors.status.done },
          { label: '進行中', value: inProgressTasks, color: tokens.colors.status.in_progress },
          { label: 'ブロック中', value: blockedTasks, color: tokens.colors.status.blocked },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '12px 16px',
            background: tokens.colors.bg.secondary,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 10.5, color: tokens.colors.text.tertiary }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Project List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="custom-scrollbar">
        {state.projects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <ProjectCard project={project} defaultExpanded={idx === 0} />
          </motion.div>
        ))}

        {/* New Project Button */}
        <motion.button
          whileHover={{ scale: 1.01, background: 'rgba(59,130,246,0.08)' }}
          whileTap={{ scale: 0.99 }}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 14, border: `2px dashed ${tokens.colors.border.default}`,
            background: 'transparent', color: tokens.colors.text.tertiary,
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Plus size={16} />
          新しいプロジェクトを追加
        </motion.button>
      </div>
    </div>
  )
}
