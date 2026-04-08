import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, CheckSquare, Calendar, Plus, Pencil, Trash2, Send, ClipboardList,
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { TeamMember, WBSTask } from '../types'
import { tokens, statusLabels } from '../utils/design'

function memberMatchesAssignee(task: WBSTask, m: TeamMember): boolean {
  if (!task.assignee) return false
  return task.assignee === m.id || task.assignee === m.name
}

export const TeamPanel: React.FC = () => {
  const { state, dispatch } = useAppState()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [reportText, setReportText] = useState('')

  const tasksByMember = useMemo(() => {
    const map = new Map<string, { projectTitle: string; task: WBSTask }[]>()
    state.teamMembers.forEach(m => map.set(m.id, []))
    state.projects.forEach(p => {
      p.tasks.forEach(t => {
        const m = state.teamMembers.find(mem => memberMatchesAssignee(t, mem))
        if (m) {
          const list = map.get(m.id) || []
          list.push({ projectTitle: p.title, task: t })
          map.set(m.id, list)
        }
      })
    })
    return map
  }, [state.projects, state.teamMembers])

  const eventCountByMember = useMemo(() => {
    const map: Record<string, number> = {}
    state.teamMembers.forEach(m => { map[m.id] = 0 })
    state.events.forEach(e => {
      e.attendees?.forEach(a => {
        const m = state.teamMembers.find(mem => mem.name === a || mem.id === a)
        if (m) map[m.id] = (map[m.id] || 0) + 1
      })
    })
    return map
  }, [state.events, state.teamMembers])

  const addMember = () => {
    const name = newName.trim()
    if (!name) return
    const id = `tm-${Date.now()}`
    dispatch({
      type: 'ADD_TEAM_MEMBER',
      payload: { id, name, role: newRole.trim() || undefined },
    })
    setNewName('')
    setNewRole('')
    setAdding(false)
  }

  const startEdit = (m: TeamMember) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditRole(m.role || '')
  }

  const saveEdit = () => {
    const m = state.teamMembers.find(x => x.id === editingId)
    if (!m) return
    const name = editName.trim()
    if (!name) return
    dispatch({
      type: 'UPDATE_TEAM_MEMBER',
      payload: { ...m, name, role: editRole.trim() || undefined },
    })
    setEditingId(null)
  }

  const removeMember = (m: TeamMember) => {
    if (!confirm(`「${m.name}」をチームから削除しますか？担当タスクの担当者名はクリアされます。`)) return
    dispatch({ type: 'DELETE_TEAM_MEMBER', payload: m.id })
    if (state.selfMemberId === m.id) dispatch({ type: 'SET_SELF_MEMBER_ID', payload: null })
    if (editingId === m.id) setEditingId(null)
  }

  const submitReport = () => {
    const text = reportText.trim()
    if (!text || !state.selfMemberId) return
    dispatch({
      type: 'ADD_TEAM_PROGRESS_REPORT',
      payload: {
        id: `rpt-${Date.now()}`,
        memberId: state.selfMemberId,
        text,
        at: new Date(),
      },
    })
    setReportText('')
  }

  const sortedReports = [...state.teamProgressReports].sort(
    (a, b) => b.at.getTime() - a.at.getTime()
  )

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: `linear-gradient(180deg, ${tokens.colors.bg.secondary} 0%, ${tokens.colors.bg.primary} 30%)`,
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
            background: 'linear-gradient(135deg, #1a73e8, #9334e6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(26,115,232,0.25)',
          }}>
            <Users size={26} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: tokens.colors.text.primary, letterSpacing: '-0.03em' }}>
              チーム
            </h1>
            <p style={{ fontSize: 13, color: tokens.colors.text.tertiary, marginTop: 4 }}>
              メンバーの担当タスクとステータスを一覧できます
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setAdding(true); setNewName(''); setNewRole('') }}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: 'none',
              background: tokens.colors.gradient.blue,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: tokens.shadow.sm,
            }}
          >
            <Plus size={18} />
            メンバー追加
          </motion.button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 28px' }} className="custom-scrollbar">
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: 18,
                padding: 18,
                borderRadius: tokens.radius.xl,
                background: tokens.colors.bg.card,
                border: `1px solid ${tokens.colors.border.subtle}`,
                boxShadow: tokens.shadow.md,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.text.primary, marginBottom: 12 }}>新しいメンバー</div>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="名前（必須）"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  marginBottom: 10,
                  borderRadius: 12,
                  border: `1px solid ${tokens.colors.border.default}`,
                  fontSize: 14,
                  background: tokens.colors.bg.secondary,
                  color: tokens.colors.text.primary,
                }}
              />
              <input
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="役割（任意）"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  marginBottom: 12,
                  borderRadius: 12,
                  border: `1px solid ${tokens.colors.border.default}`,
                  fontSize: 14,
                  background: tokens.colors.bg.secondary,
                  color: tokens.colors.text.primary,
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={addMember} disabled={!newName.trim()} style={{
                  padding: '10px 18px', borderRadius: 10, border: 'none', background: tokens.colors.accent.blue, color: '#fff',
                  fontWeight: 600, fontSize: 13, cursor: newName.trim() ? 'pointer' : 'not-allowed', opacity: newName.trim() ? 1 : 0.5,
                }}>
                  追加
                </motion.button>
                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => setAdding(false)} style={{
                  padding: '10px 18px', borderRadius: 10, border: `1px solid ${tokens.colors.border.default}`,
                  background: tokens.colors.bg.secondary, color: tokens.colors.text.secondary, fontSize: 13, cursor: 'pointer',
                }}>
                  キャンセル
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{
          padding: 20,
          borderRadius: tokens.radius.xl,
          background: tokens.colors.bg.card,
          border: `1px solid ${tokens.colors.border.subtle}`,
          boxShadow: tokens.shadow.md,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ClipboardList size={20} color={tokens.colors.accent.purple} />
            <span style={{ fontSize: 15, fontWeight: 700, color: tokens.colors.text.primary }}>自分の進捗を報告</span>
          </div>
          <p style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginBottom: 12, lineHeight: 1.5 }}>
            まず「自分は誰か」を選び、今日の進捗やブロッカーを短く残せます。チームの進捗ログに表示されます。
          </p>
          <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.secondary, display: 'block', marginBottom: 6 }}>
            自分のプロフィール
          </label>
          <select
            value={state.selfMemberId || ''}
            onChange={e => dispatch({ type: 'SET_SELF_MEMBER_ID', payload: e.target.value || null })}
            style={{
              width: '100%',
              maxWidth: 360,
              padding: '10px 12px',
              marginBottom: 14,
              borderRadius: 10,
              border: `1px solid ${tokens.colors.border.default}`,
              fontSize: 13,
              background: tokens.colors.bg.secondary,
              color: tokens.colors.text.primary,
            }}
          >
            <option value="">選択してください（メンバーを追加後に選べます）</option>
            {state.teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>
            ))}
          </select>
          <textarea
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            placeholder="例：〇〇のデザイン案を共有済み。△△はレビュー待ちです。"
            rows={3}
            disabled={!state.selfMemberId}
            style={{
              width: '100%',
              padding: '12px 14px',
              marginBottom: 12,
              borderRadius: 12,
              border: `1px solid ${tokens.colors.border.default}`,
              fontSize: 13,
              resize: 'vertical',
              background: state.selfMemberId ? tokens.colors.bg.secondary : tokens.colors.bg.tertiary,
              color: tokens.colors.text.primary,
              opacity: state.selfMemberId ? 1 : 0.7,
            }}
          />
          <motion.button
            type="button"
            whileHover={{ scale: state.selfMemberId && reportText.trim() ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={submitReport}
            disabled={!state.selfMemberId || !reportText.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: tokens.colors.gradient.purple,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: state.selfMemberId && reportText.trim() ? 'pointer' : 'not-allowed',
              opacity: state.selfMemberId && reportText.trim() ? 1 : 0.45,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Send size={16} />
            進捗を記録
          </motion.button>
        </div>

        {sortedReports.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: tokens.colors.text.tertiary, marginBottom: 12, letterSpacing: '0.04em' }}>
              進捗ログ
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedReports.slice(0, 40).map(r => {
                const author = state.teamMembers.find(m => m.id === r.memberId)
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: tokens.colors.bg.card,
                      border: `1px solid ${tokens.colors.border.subtle}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.text.primary }}>
                        {author?.name || '不明なメンバー'}
                      </span>
                      <span style={{ fontSize: 11, color: tokens.colors.text.tertiary, flexShrink: 0 }}>
                        {format(r.at, 'M/d HH:mm', { locale: ja })}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: tokens.colors.text.secondary, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{r.text}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 style={{ fontSize: 13, fontWeight: 700, color: tokens.colors.text.tertiary, marginBottom: 14, letterSpacing: '0.04em' }}>
          メンバーとタスク
        </h2>

        {state.teamMembers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            borderRadius: tokens.radius.xl,
            background: tokens.colors.bg.card,
            border: `1px dashed ${tokens.colors.border.default}`,
            color: tokens.colors.text.tertiary,
            fontSize: 14,
          }}>
            メンバーがまだいません。「メンバー追加」から登録してください。タスク編集で担当者に名前を入れると、ここに紐づいて表示されます。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {state.teamMembers.map((m, idx) => {
              const tasks = tasksByMember.get(m.id) || []
              const done = tasks.filter(x => x.task.status === 'done').length
              const evCount = eventCountByMember[m.id] || 0
              const inProgress = tasks.filter(x => x.task.status === 'in_progress').length
              const blocked = tasks.filter(x => x.task.status === 'blocked').length
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{
                    borderRadius: tokens.radius.xl,
                    background: tokens.colors.bg.card,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    boxShadow: tokens.shadow.md,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    borderBottom: tasks.length > 0 ? `1px solid ${tokens.colors.border.subtle}` : 'none',
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: `linear-gradient(135deg, hsl(${idx * 47 + 200}, 55%, 48%), hsl(${idx * 47 + 240}, 50%, 42%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>
                      {m.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === m.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input value={editName} onChange={e => setEditName(e.target.value)} style={{
                            padding: '8px 10px', borderRadius: 8, border: `1px solid ${tokens.colors.border.default}`, fontSize: 14, fontWeight: 600,
                            background: tokens.colors.bg.secondary, color: tokens.colors.text.primary,
                          }} />
                          <input value={editRole} onChange={e => setEditRole(e.target.value)} placeholder="役割" style={{
                            padding: '8px 10px', borderRadius: 8, border: `1px solid ${tokens.colors.border.default}`, fontSize: 13,
                            background: tokens.colors.bg.secondary, color: tokens.colors.text.primary,
                          }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" onClick={saveEdit} style={{
                              padding: '6px 12px', borderRadius: 8, border: 'none', background: tokens.colors.accent.blue, color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                            }}>保存</button>
                            <button type="button" onClick={() => setEditingId(null)} style={{
                              padding: '6px 12px', borderRadius: 8, border: `1px solid ${tokens.colors.border.default}`, background: 'transparent', fontSize: 12, cursor: 'pointer',
                            }}>キャンセル</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 17, fontWeight: 800, color: tokens.colors.text.primary }}>{m.name}</div>
                          {m.role && (
                            <div style={{ fontSize: 12, color: tokens.colors.accent.blue, fontWeight: 600, marginTop: 4 }}>{m.role}</div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: tokens.colors.text.secondary }}>
                              <CheckSquare size={15} color={tokens.colors.status.done} />
                              <span style={{ fontWeight: 700, color: tokens.colors.text.primary }}>{done}/{tasks.length}</span>
                              <span style={{ color: tokens.colors.text.tertiary }}>タスク完了</span>
                            </div>
                            {inProgress > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: tokens.colors.status.in_progress, padding: '2px 8px', borderRadius: 99, background: `${tokens.colors.status.in_progress}18` }}>
                                進行中 {inProgress}
                              </span>
                            )}
                            {blocked > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: tokens.colors.status.blocked, padding: '2px 8px', borderRadius: 99, background: `${tokens.colors.status.blocked}18` }}>
                                ブロック {blocked}
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: tokens.colors.text.tertiary }}>
                              <Calendar size={14} />
                              参加予定 {evCount} 件
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {editingId !== m.id && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <motion.button type="button" whileTap={{ scale: 0.92 }} title="編集" onClick={() => startEdit(m)} style={{
                          padding: 10, border: 'none', background: tokens.colors.bg.tertiary, borderRadius: 10, cursor: 'pointer', color: tokens.colors.text.secondary,
                        }}>
                          <Pencil size={16} />
                        </motion.button>
                        <motion.button type="button" whileTap={{ scale: 0.92 }} title="削除" onClick={() => removeMember(m)} style={{
                          padding: 10, border: 'none', background: `${tokens.colors.accent.red}12`, borderRadius: 10, cursor: 'pointer', color: tokens.colors.accent.red,
                        }}>
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {tasks.length > 0 && (
                    <div style={{ padding: '12px 16px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: tokens.colors.text.tertiary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        担当タスク
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tasks.map(({ projectTitle, task: t }) => (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 14px',
                              borderRadius: 12,
                              background: tokens.colors.bg.tertiary,
                              border: `1px solid ${tokens.colors.border.subtle}`,
                            }}
                          >
                            <div style={{
                              width: 6, alignSelf: 'stretch', borderRadius: 99,
                              background:
                                t.status === 'done' ? tokens.colors.status.done
                                  : t.status === 'blocked' ? tokens.colors.status.blocked
                                    : t.status === 'in_progress' ? tokens.colors.status.in_progress
                                      : tokens.colors.status.todo,
                              flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: tokens.colors.text.tertiary, marginBottom: 2 }}>{projectTitle}</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary }}>{t.title}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, alignItems: 'center' }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 700,
                                  color: tokens.colors.status[t.status],
                                  padding: '3px 10px',
                                  borderRadius: 99,
                                  background: `${tokens.colors.status[t.status]}18`,
                                }}>
                                  {statusLabels[t.status]}
                                </span>
                                {t.dueDate && (
                                  <span style={{ fontSize: 11, color: tokens.colors.text.tertiary }}>
                                    期限 {format(t.dueDate, 'M/d(E)', { locale: ja })}
                                  </span>
                                )}
                                {t.progress > 0 && t.status === 'in_progress' && (
                                  <span style={{ fontSize: 11, color: tokens.colors.accent.blue, fontWeight: 600 }}>{t.progress}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tasks.length === 0 && (
                    <div style={{ padding: '14px 20px 18px', fontSize: 12, color: tokens.colors.text.tertiary }}>
                      担当タスクはありません。タスクの編集で担当者に「{m.name}」を指定してください。
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
