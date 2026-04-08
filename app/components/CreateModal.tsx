import React, { useState, useEffect, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Calendar, CheckSquare, Zap, Plus, ArrowLeft, Loader2, MapPin, FileText,
} from 'lucide-react'
import { format, setHours, setMinutes, addMonths, subWeeks, subDays, addHours } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppState } from '../store/AppContext'
import { CalendarEvent, WBSProject, WBSTask } from '../types'
import { tokens } from '../utils/design'
import { getGeminiApiKey, subscribeGeminiApiKey, getGeminiConfiguredSnapshot } from '../utils/aiConfig'
import { buildCalendarContextForAi } from '../utils/buildAiContext'
import { geminiSuggestWbsTasks, type WbsTaskSuggestion, type WbsAiOptions } from '../services/geminiClient'

const COLORS = { work: '#3B82F6', project: '#F59E0B', event: '#EC4899' }

/** イベントからテンプレートWBSプロジェクトを生成（形だけ・AIは未使用） */
function createProjectFromEvent(event: CalendarEvent): WBSProject {
  const now = new Date()
  const eventDate = event.start
  const oneMonthBefore = addMonths(eventDate, -1)
  const templateTasks: WBSTask[] = [
    { id: `t-${Date.now()}-1`, title: 'リリース社内調整', description: 'リリース日の1週間前まで', status: 'todo', priority: 'high', progress: 0, dueDate: subWeeks(oneMonthBefore, 1), tags: ['社内調整'] },
    { id: `t-${Date.now()}-2`, title: 'リリース日', description: 'イベントの1か月前', status: 'todo', priority: 'high', progress: 0, dueDate: oneMonthBefore, tags: ['リリース'] },
    { id: `t-${Date.now()}-3`, title: 'イベント募集開始', description: '土日イベントは1か月前の金曜から', status: 'todo', priority: 'high', progress: 0, dueDate: oneMonthBefore, tags: ['募集'] },
    { id: `t-${Date.now()}-4`, title: '幕間告知：動画完成・共有', description: '上映週の月曜までに共有', status: 'todo', priority: 'medium', progress: 0, dueDate: oneMonthBefore, tags: ['告知'] },
    { id: `t-${Date.now()}-5`, title: 'リマインドLINE', description: 'イベント2週間前', status: 'todo', priority: 'medium', progress: 0, dueDate: subWeeks(eventDate, 2), tags: ['リマインド'] },
    { id: `t-${Date.now()}-6`, title: '予約者リマインドメール', description: 'イベント4日前', status: 'todo', priority: 'medium', progress: 0, dueDate: subDays(eventDate, 4), tags: ['リマインド'] },
  ]
  const projId = `proj-${Date.now()}`
  return {
    id: projId,
    title: `${event.title} の準備`,
    description: `「${event.title}」から生成したWBS（テンプレート。APIキー未設定時はこちらを使用）`,
    color: COLORS.event,
    eventId: event.id,
    tasks: templateTasks,
    createdAt: now,
    updatedAt: now,
    dueDate: eventDate,
    progress: 0,
  }
}

function buildProjectFromAiText(goalTitle: string, anchorStart: Date, suggestions: WbsTaskSuggestion[]): WBSProject {
  const now = new Date()
  const projId = `proj-${Date.now()}`
  const tasks: WBSTask[] = suggestions.map((s, i) => ({
    id: `t-${Date.now()}-${i}`,
    title: s.title,
    description: s.description,
    status: 'todo',
    priority: s.priority === 'critical' ? 'high' : s.priority,
    progress: 0,
    dueDate: s.dueDate,
    tags: ['AI生成'],
  }))
  return {
    id: projId,
    title: `${goalTitle} の準備`,
    description: `文章・要件から Gemini で生成（ゴール: ${format(anchorStart, 'yyyy-MM-dd HH:mm', { locale: ja })}）`,
    color: COLORS.event,
    eventId: undefined,
    tasks,
    createdAt: now,
    updatedAt: now,
    dueDate: anchorStart,
    progress: 0,
  }
}

function buildProjectFromAiSuggestions(event: CalendarEvent, suggestions: WbsTaskSuggestion[]): WBSProject {
  const now = new Date()
  const projId = `proj-${Date.now()}`
  const tasks: WBSTask[] = suggestions.map((s, i) => ({
    id: `t-${Date.now()}-${i}`,
    title: s.title,
    description: s.description,
    status: 'todo',
    priority: s.priority === 'critical' ? 'high' : s.priority,
    progress: 0,
    dueDate: s.dueDate,
    tags: ['AI生成'],
  }))
  return {
    id: projId,
    title: `${event.title} の準備`,
    description: `「${event.title}」を Gemini で分解したWBS`,
    color: COLORS.event,
    eventId: event.id,
    tasks,
    createdAt: now,
    updatedAt: now,
    dueDate: event.start,
    progress: 0,
  }
}

type Step = 'choice' | 'event' | 'wbs'

export const CreateModal: React.FC = () => {
  const { state, dispatch } = useAppState()
  const [step, setStep] = useState<Step>('choice')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [eventStart, setEventStart] = useState('10:00')
  const [eventEnd, setEventEnd] = useState('11:00')
  const [eventDesc, setEventDesc] = useState('')
  const [wbsGenerated, setWbsGenerated] = useState(false)
  const [wbsLoading, setWbsLoading] = useState(false)
  const [wbsGenKind, setWbsGenKind] = useState<'ai' | 'template' | null>(null)
  const [wbsError, setWbsError] = useState<string | null>(null)
  const [wbsFailedEvent, setWbsFailedEvent] = useState<CalendarEvent | null>(null)
  /** APIキーなしで予定を選んだとき、テンプレートでは即作成しない */
  const [wbsDeferredEvent, setWbsDeferredEvent] = useState<CalendarEvent | null>(null)
  const [wbsViaEventIds, setWbsViaEventIds] = useState<string[]>([])
  const [wbsFreeText, setWbsFreeText] = useState('')
  const [wbsSubTab, setWbsSubTab] = useState<'calendar' | 'text'>('calendar')
  const [wbsPickedEventId, setWbsPickedEventId] = useState<string | null>(null)
  const [wbsTextTitle, setWbsTextTitle] = useState('')
  const [wbsTextDate, setWbsTextDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [wbsTextTime, setWbsTextTime] = useState('18:00')
  const [wbsTextBody, setWbsTextBody] = useState('')
  const [wbsRetryFromText, setWbsRetryFromText] = useState(false)

  const geminiConfigured = useSyncExternalStore(
    subscribeGeminiApiKey,
    getGeminiConfiguredSnapshot,
    () => false
  )

  const isEdit = !!state.editingEventId
  const editingEvent = state.editingEventId ? state.events.find(e => e.id === state.editingEventId) : null

  useEffect(() => {
    if (!state.createModalOpen) {
      setStep('choice')
      setWbsGenerated(false)
      setWbsError(null)
      setWbsFailedEvent(null)
      setWbsDeferredEvent(null)
      setWbsViaEventIds([])
      setWbsFreeText('')
      setWbsSubTab('calendar')
      setWbsPickedEventId(null)
      setWbsTextTitle('')
      setWbsTextDate(format(new Date(), 'yyyy-MM-dd'))
      setWbsTextTime('18:00')
      setWbsTextBody('')
      setWbsRetryFromText(false)
      return
    }
    setStep(state.createModalMode === 'choice' ? 'choice' : state.createModalMode === 'event' ? 'event' : 'wbs')
    const editEv = state.editingEventId ? state.events.find(e => e.id === state.editingEventId) : null
    if (editEv) {
      setEventTitle(editEv.title)
      setEventDate(format(editEv.start, 'yyyy-MM-dd'))
      setEventStart(format(editEv.start, 'HH:mm'))
      setEventEnd(format(editEv.end, 'HH:mm'))
      setEventDesc(editEv.description || '')
    } else if (state.createModalInitialDateTime) {
      setEventTitle('')
      setEventDate(state.createModalInitialDateTime.date)
      setEventStart(state.createModalInitialDateTime.start)
      setEventEnd(state.createModalInitialDateTime.end)
      setEventDesc('')
    } else {
      setEventTitle('')
      setEventDate(format(new Date(), 'yyyy-MM-dd'))
      setEventStart('10:00')
      setEventEnd('11:00')
      setEventDesc('')
    }
  }, [state.createModalOpen, state.createModalMode, state.editingEventId, state.createModalInitialDateTime, state.events])

  useEffect(() => {
    if (!state.createModalOpen || state.createModalMode !== 'wbs') return
    setWbsViaEventIds([])
    setWbsFreeText('')
    setWbsRetryFromText(false)
    setWbsPickedEventId(state.createModalPreselectedEventId ?? null)
  }, [state.createModalOpen, state.createModalMode, state.createModalPreselectedEventId])

  const close = () => {
    dispatch({ type: 'CLOSE_CREATE_MODAL' })
    dispatch({ type: 'SET_EDITING_EVENT', payload: null })
  }

  const submitEvent = () => {
    const [sh, sm] = eventStart.split(':').map(Number)
    const [eh, em] = eventEnd.split(':').map(Number)
    const d = new Date(eventDate)
    const start = setMinutes(setHours(d, sh), sm)
    const end = setMinutes(setHours(d, eh), em)
    if (isEdit && editingEvent) {
      dispatch({
        type: 'UPDATE_EVENT',
        payload: {
          ...editingEvent,
          title: eventTitle,
          description: eventDesc || undefined,
          start,
          end,
        },
      })
    } else {
      dispatch({
        type: 'ADD_EVENT',
        payload: {
          id: `evt-${Date.now()}`,
          title: eventTitle,
          description: eventDesc || undefined,
          start,
          end,
          category: 'work',
          color: COLORS.work,
          priority: 'medium',
        },
      })
    }
    close()
  }

  const commitWbsProject = (project: WBSProject, event: CalendarEvent) => {
    dispatch({ type: 'ADD_PROJECT', payload: project })
    dispatch({
      type: 'UPDATE_EVENT',
      payload: { ...event, wbsId: project.id },
    })
    setWbsGenerated(true)
    setWbsError(null)
    setWbsFailedEvent(null)
    setWbsRetryFromText(false)
    setTimeout(() => {
      dispatch({ type: 'SELECT_PROJECT', payload: project.id })
      dispatch({ type: 'SET_PANEL', payload: 'both' })
      close()
    }, 600)
  }

  const commitWbsProjectStandalone = (project: WBSProject) => {
    dispatch({ type: 'ADD_PROJECT', payload: project })
    setWbsGenerated(true)
    setWbsError(null)
    setWbsFailedEvent(null)
    setWbsDeferredEvent(null)
    setWbsRetryFromText(false)
    setTimeout(() => {
      dispatch({ type: 'SELECT_PROJECT', payload: project.id })
      dispatch({ type: 'SET_PANEL', payload: 'both' })
      close()
    }, 600)
  }

  const getWbsAiOptions = (): WbsAiOptions => ({
    viaEvents: wbsViaEventIds
      .map(id => state.events.find(e => e.id === id))
      .filter((e): e is CalendarEvent => !!e),
    userNotes: wbsFreeText.trim() || undefined,
  })

  const toggleWbsVia = (id: string) => {
    setWbsViaEventIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const generateWBS = async (event: CalendarEvent) => {
    const key = getGeminiApiKey()
    if (!key) {
      setWbsDeferredEvent(event)
      setWbsError(null)
      setWbsFailedEvent(null)
      return
    }
    setWbsGenKind('ai')
    setWbsLoading(true)
    setWbsError(null)
    setWbsFailedEvent(null)
    setWbsDeferredEvent(null)
    try {
      const ctx = buildCalendarContextForAi(state.events, state.projects)
      const suggestions = await geminiSuggestWbsTasks(event, ctx, getWbsAiOptions())
      const project =
        suggestions.length > 0
          ? buildProjectFromAiSuggestions(event, suggestions)
          : createProjectFromEvent(event)
      commitWbsProject(project, event)
    } catch (e) {
      setWbsDeferredEvent(null)
      setWbsRetryFromText(false)
      setWbsError(e instanceof Error ? e.message : 'WBSのAI生成に失敗しました')
      setWbsFailedEvent(event)
    } finally {
      setWbsLoading(false)
      setWbsGenKind(null)
    }
  }

  const generateWBSFromText = async () => {
    const key = getGeminiApiKey()
    if (!key) {
      setWbsError('Gemini API キーが未設定です。設定でキーを保存してください。')
      setWbsRetryFromText(true)
      setWbsFailedEvent(null)
      return
    }
    const title = wbsTextTitle.trim()
    if (!title) {
      setWbsError('ゴール名（タイトル）を入力してください。')
      setWbsRetryFromText(true)
      setWbsFailedEvent(null)
      return
    }
    setWbsGenKind('ai')
    setWbsLoading(true)
    setWbsError(null)
    setWbsFailedEvent(null)
    setWbsDeferredEvent(null)
    try {
      const [th, tmi] = wbsTextTime.split(':').map(n => parseInt(n, 10))
      const d = new Date(wbsTextDate)
      const start = setMinutes(setHours(d, Number.isFinite(th) ? th : 18), Number.isFinite(tmi) ? tmi : 0)
      const synthetic: CalendarEvent = {
        id: `syn-wbs-${Date.now()}`,
        title,
        start,
        end: addHours(start, 1),
        category: 'project',
        color: COLORS.event,
        priority: 'medium',
        description: wbsTextBody.trim() || undefined,
      }
      const ctx = buildCalendarContextForAi(state.events, state.projects)
      const suggestions = await geminiSuggestWbsTasks(synthetic, ctx, getWbsAiOptions())
      const project =
        suggestions.length > 0
          ? buildProjectFromAiText(title, start, suggestions)
          : createProjectFromEvent(synthetic)
      commitWbsProjectStandalone(project)
    } catch (e) {
      setWbsError(e instanceof Error ? e.message : 'WBSのAI生成に失敗しました')
      setWbsRetryFromText(true)
      setWbsFailedEvent(null)
    } finally {
      setWbsLoading(false)
      setWbsGenKind(null)
    }
  }

  const generateWbsFromTemplateOnly = (event: CalendarEvent) => {
    setWbsGenKind('template')
    setWbsLoading(true)
    setWbsError(null)
    setWbsFailedEvent(null)
    setWbsDeferredEvent(null)
    try {
      commitWbsProject(createProjectFromEvent(event), event)
    } finally {
      setWbsLoading(false)
      setWbsGenKind(null)
    }
  }

  const preselected = state.createModalPreselectedEventId
    ? state.events.find(e => e.id === state.createModalPreselectedEventId)
    : null

  const mainEventForWbs: CalendarEvent | null =
    wbsSubTab === 'text'
      ? null
      : (wbsPickedEventId ? state.events.find(e => e.id === wbsPickedEventId) ?? null : null) ?? preselected ?? null

  const viaCandidates = [...state.events]
    .filter(e => !mainEventForWbs || e.id !== mainEventForWbs.id)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  if (!state.createModalOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: tokens.colors.overlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            background: tokens.colors.bg.secondary,
            borderRadius: 16,
            border: `1px solid ${tokens.colors.border.subtle}`,
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${tokens.colors.border.subtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {step !== 'choice' ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setStep('choice')}
                style={{ padding: 6, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}
              >
                <ArrowLeft size={18} />
              </motion.button>
            ) : null}
            <h2 style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.text.primary, flex: 1, textAlign: step === 'choice' ? 'left' : 'center' }}>
              {step === 'choice' && '新規作成'}
              {step === 'event' && (isEdit ? '予定を編集' : '予定を追加')}
              {step === 'wbs' && 'イベントからWBSを作成'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={close}
              style={{ padding: 6, border: 'none', background: 'transparent', color: tokens.colors.text.tertiary, cursor: 'pointer' }}
            >
              <X size={18} />
            </motion.button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }} className="custom-scrollbar">
            {step === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('event')}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 12,
                    border: `1px solid ${tokens.colors.border.default}`,
                    background: tokens.colors.bg.card,
                    color: tokens.colors.text.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${COLORS.work}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={22} color={COLORS.work} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>予定を追加</div>
                    <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 2 }}>カレンダーに新しい予定を登録します</div>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('wbs')}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 12,
                    border: `1px solid ${tokens.colors.border.default}`,
                    background: tokens.colors.bg.card,
                    color: tokens.colors.text.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${COLORS.event}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={22} color={COLORS.event} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>イベントからWBSを作成</div>
                    <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 2 }}>既存の予定からタスク（WBS）を自動生成します</div>
                  </div>
                </motion.button>
              </div>
            )}

            {step === 'event' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, display: 'block', marginBottom: 6 }}>タイトル</label>
                  <input
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="予定のタイトル"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${tokens.colors.border.default}`,
                      background: tokens.colors.bg.card,
                      color: tokens.colors.text.primary,
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, display: 'block', marginBottom: 6 }}>日付</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: `1px solid ${tokens.colors.border.default}`,
                        background: tokens.colors.bg.card,
                        color: tokens.colors.text.primary,
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, display: 'block', marginBottom: 6 }}>時間</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="time"
                        value={eventStart}
                        onChange={e => setEventStart(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 10,
                          border: `1px solid ${tokens.colors.border.default}`,
                          background: tokens.colors.bg.card,
                          color: tokens.colors.text.primary,
                          fontSize: 14,
                        }}
                      />
                      <span style={{ alignSelf: 'center', color: tokens.colors.text.tertiary }}>〜</span>
                      <input
                        type="time"
                        value={eventEnd}
                        onChange={e => setEventEnd(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 10,
                          border: `1px solid ${tokens.colors.border.default}`,
                          background: tokens.colors.bg.card,
                          color: tokens.colors.text.primary,
                          fontSize: 14,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.tertiary, display: 'block', marginBottom: 6 }}>説明（任意）</label>
                  <textarea
                    value={eventDesc}
                    onChange={e => setEventDesc(e.target.value)}
                    placeholder="メモや詳細"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${tokens.colors.border.default}`,
                      background: tokens.colors.bg.card,
                      color: tokens.colors.text.primary,
                      fontSize: 14,
                      resize: 'vertical',
                    }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitEvent}
                  disabled={!eventTitle.trim()}
                  style={{
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: eventTitle.trim() ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : tokens.colors.bg.tertiary,
                    color: '#fff',
                    cursor: eventTitle.trim() ? 'pointer' : 'not-allowed',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {isEdit ? '保存' : '予定を追加'}
                </motion.button>
              </div>
            )}

            {step === 'wbs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {wbsError && (wbsFailedEvent || wbsRetryFromText) && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: `${tokens.colors.accent.red}12`,
                      border: `1px solid ${tokens.colors.accent.red}38`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 13, color: tokens.colors.text.primary, lineHeight: 1.5 }}>
                      {wbsError}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={wbsLoading}
                        type="button"
                        onClick={() => (wbsRetryFromText ? generateWBSFromText() : wbsFailedEvent && generateWBS(wbsFailedEvent))}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: 'none',
                          background: tokens.colors.gradient.blue,
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: wbsLoading ? 'not-allowed' : 'pointer',
                          opacity: wbsLoading ? 0.7 : 1,
                        }}
                      >
                        再試行
                      </motion.button>
                      {wbsFailedEvent && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={wbsLoading}
                          type="button"
                          onClick={() => generateWbsFromTemplateOnly(wbsFailedEvent)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: `1px solid ${tokens.colors.border.default}`,
                            background: tokens.colors.bg.card,
                            color: tokens.colors.text.primary,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: wbsLoading ? 'not-allowed' : 'pointer',
                            opacity: wbsLoading ? 0.7 : 1,
                          }}
                        >
                          テンプレートで作成
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}
                {wbsDeferredEvent && !wbsError && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: `${tokens.colors.accent.amber}14`,
                      border: `1px solid ${tokens.colors.accent.amber}45`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 13, color: tokens.colors.text.primary, lineHeight: 1.5 }}>
                      <strong>{wbsDeferredEvent.title}</strong> 用の WBS を Gemini で作るには、API キーが必要です。設定でキーを保存するか、テンプレートのみ作成してください。
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: 'none',
                          background: tokens.colors.gradient.blue,
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        設定を開く
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={wbsLoading}
                        type="button"
                        onClick={() => generateWbsFromTemplateOnly(wbsDeferredEvent)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: `1px solid ${tokens.colors.border.default}`,
                          background: tokens.colors.bg.card,
                          color: tokens.colors.text.primary,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: wbsLoading ? 'not-allowed' : 'pointer',
                          opacity: wbsLoading ? 0.7 : 1,
                        }}
                      >
                        テンプレートで作成
                      </motion.button>
                      {geminiConfigured && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={wbsLoading}
                          type="button"
                          onClick={() => generateWBS(wbsDeferredEvent)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: wbsLoading ? 'not-allowed' : 'pointer',
                            opacity: wbsLoading ? 0.7 : 1,
                          }}
                        >
                          Gemini で生成
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setWbsSubTab('calendar')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${wbsSubTab === 'calendar' ? tokens.colors.accent.blue : tokens.colors.border.default}`,
                      background: wbsSubTab === 'calendar' ? `${tokens.colors.accent.blue}14` : tokens.colors.bg.card,
                      color: tokens.colors.text.primary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Calendar size={16} />
                    カレンダー
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setWbsSubTab('text')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${wbsSubTab === 'text' ? tokens.colors.accent.blue : tokens.colors.border.default}`,
                      background: wbsSubTab === 'text' ? `${tokens.colors.accent.blue}14` : tokens.colors.bg.card,
                      color: tokens.colors.text.primary,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={16} />
                    文章から
                  </motion.button>
                </div>

                {wbsSubTab === 'calendar' && (
                  <>
                    <p style={{ fontSize: 12, color: tokens.colors.text.secondary, lineHeight: 1.5, marginBottom: 10 }}>
                      ゴールとなる予定を1件選び、必要ならカレンダー上の経由地（チェックポイント）を追加します。追加メモもプロンプトに含めます。
                    </p>
                    {state.events.length === 0 ? (
                      <p style={{ fontSize: 12, color: tokens.colors.text.tertiary }}>予定がありません。先に「予定を追加」で登録してください。</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {state.events.map(evt => {
                          const sel = mainEventForWbs?.id === evt.id
                          return (
                            <motion.button
                              key={evt.id}
                              type="button"
                              whileHover={{ x: 2 }}
                              disabled={wbsLoading}
                              onClick={() => setWbsPickedEventId(evt.id)}
                              style={{
                                padding: '12px 14px',
                                borderRadius: 10,
                                border: sel ? `2px solid ${evt.color}` : `1px solid ${tokens.colors.border.default}`,
                                background: sel ? `${evt.color}12` : tokens.colors.bg.card,
                                color: tokens.colors.text.primary,
                                cursor: wbsLoading ? 'not-allowed' : 'pointer',
                                opacity: wbsLoading ? 0.6 : 1,
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                              }}
                            >
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: evt.color, flexShrink: 0 }} />
                              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{evt.title}</span>
                              <span style={{ fontSize: 11, color: tokens.colors.text.tertiary }}>{format(evt.start, 'M/d')}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    )}
                    {mainEventForWbs && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 14,
                          borderRadius: 12,
                          background: `${mainEventForWbs.color}15`,
                          border: `1px solid ${mainEventForWbs.color}30`,
                        }}
                      >
                        <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginBottom: 4 }}>ゴール（メイン予定）</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: tokens.colors.text.primary }}>{mainEventForWbs.title}</div>
                        <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 4 }}>
                          {format(mainEventForWbs.start, 'M月d日(E) H:mm', { locale: ja })} 〜
                        </div>
                      </div>
                    )}
                  </>
                )}

                {wbsSubTab === 'text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 12, color: tokens.colors.text.secondary, lineHeight: 1.5 }}>
                      ゴールのタイトル・日時・補足文章から WBS を生成します。カレンダーの経由地は任意で足せます。
                    </p>
                    <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.secondary }}>ゴール名</label>
                    <input
                      type="text"
                      value={wbsTextTitle}
                      onChange={e => setWbsTextTitle(e.target.value)}
                      placeholder="例: 四半期レビュー資料の完成"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${tokens.colors.border.default}`,
                        background: tokens.colors.bg.card,
                        color: tokens.colors.text.primary,
                        fontSize: 14,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.secondary, display: 'block', marginBottom: 4 }}>日付</label>
                        <input
                          type="date"
                          value={wbsTextDate}
                          onChange={e => setWbsTextDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `1px solid ${tokens.colors.border.default}`,
                            background: tokens.colors.bg.card,
                            color: tokens.colors.text.primary,
                            fontSize: 14,
                          }}
                        />
                      </div>
                      <div style={{ width: 120 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.secondary, display: 'block', marginBottom: 4 }}>時刻</label>
                        <input
                          type="time"
                          value={wbsTextTime}
                          onChange={e => setWbsTextTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `1px solid ${tokens.colors.border.default}`,
                            background: tokens.colors.bg.card,
                            color: tokens.colors.text.primary,
                            fontSize: 14,
                          }}
                        />
                      </div>
                    </div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.secondary }}>補足・要件（任意）</label>
                    <textarea
                      value={wbsTextBody}
                      onChange={e => setWbsTextBody(e.target.value)}
                      placeholder="達成条件、制約、関係者など"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${tokens.colors.border.default}`,
                        background: tokens.colors.bg.card,
                        color: tokens.colors.text.primary,
                        fontSize: 14,
                        resize: 'vertical',
                        minHeight: 88,
                      }}
                    />
                  </div>
                )}

                {(wbsSubTab === 'calendar' && mainEventForWbs) || wbsSubTab === 'text' ? (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.secondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} />
                      経由地（カレンダーから、任意）
                    </div>
                    {viaCandidates.length === 0 ? (
                      <p style={{ fontSize: 11, color: tokens.colors.text.tertiary }}>他に登録された予定がありません。</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                        {viaCandidates.map(evt => {
                          const on = wbsViaEventIds.includes(evt.id)
                          return (
                            <label
                              key={evt.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: `1px solid ${tokens.colors.border.default}`,
                                background: on ? `${tokens.colors.accent.blue}0d` : tokens.colors.bg.card,
                                cursor: 'pointer',
                                fontSize: 13,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => toggleWbsVia(evt.id)}
                                style={{ width: 16, height: 16, accentColor: tokens.colors.accent.blue }}
                              />
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: evt.color, flexShrink: 0 }} />
                              <span style={{ flex: 1, color: tokens.colors.text.primary }}>{evt.title}</span>
                              <span style={{ fontSize: 11, color: tokens.colors.text.tertiary }}>{format(evt.start, 'M/d HH:mm')}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                    <label style={{ fontSize: 12, fontWeight: 600, color: tokens.colors.text.secondary }}>追加メモ（プロンプトに含める）</label>
                    <textarea
                      value={wbsFreeText}
                      onChange={e => setWbsFreeText(e.target.value)}
                      placeholder="例: 出張前に承認が必要、資料は英語版も"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${tokens.colors.border.default}`,
                        background: tokens.colors.bg.card,
                        color: tokens.colors.text.primary,
                        fontSize: 13,
                        resize: 'vertical',
                        minHeight: 72,
                      }}
                    />
                  </div>
                ) : null}

                {wbsSubTab === 'calendar' && mainEventForWbs && !wbsGenerated && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {!geminiConfigured ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ fontSize: 12, color: tokens.colors.text.secondary, lineHeight: 1.5 }}>
                          Gemini で生成するには設定で API キーを保存してください。キーなしではテンプレートのみ作成できます。
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 10,
                              border: 'none',
                              background: tokens.colors.gradient.blue,
                              color: '#fff',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            設定を開く
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={wbsLoading}
                            onClick={() => generateWbsFromTemplateOnly(mainEventForWbs)}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 10,
                              border: `1px solid ${tokens.colors.border.default}`,
                              background: tokens.colors.bg.card,
                              color: tokens.colors.text.primary,
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: wbsLoading ? 'not-allowed' : 'pointer',
                            }}
                          >
                            テンプレートで作成
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <motion.button
                          type="button"
                          whileHover={{ scale: wbsLoading ? 1 : 1.02 }}
                          whileTap={{ scale: wbsLoading ? 1 : 0.98 }}
                          disabled={wbsLoading}
                          onClick={() => generateWBS(mainEventForWbs)}
                          style={{
                            padding: '12px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                            color: '#fff',
                            cursor: wbsLoading ? 'not-allowed' : 'pointer',
                            opacity: wbsLoading ? 0.85 : 1,
                            fontSize: 14,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          <Zap size={16} />
                          {wbsLoading ? '生成中…' : 'WBSを生成（Gemini）'}
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={wbsLoading}
                          onClick={() => generateWbsFromTemplateOnly(mainEventForWbs)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${tokens.colors.border.default}`,
                            background: tokens.colors.bg.card,
                            color: tokens.colors.text.primary,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: wbsLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          テンプレートのみ作成
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {wbsSubTab === 'text' && !wbsGenerated && (
                  <div style={{ marginTop: 14 }}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: wbsLoading ? 1 : 1.02 }}
                      whileTap={{ scale: wbsLoading ? 1 : 0.98 }}
                      disabled={wbsLoading}
                      onClick={() => generateWBSFromText()}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 12,
                        border: 'none',
                        background: geminiConfigured ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : tokens.colors.bg.card,
                        color: geminiConfigured ? '#fff' : tokens.colors.text.tertiary,
                        cursor: wbsLoading || !geminiConfigured ? 'not-allowed' : 'pointer',
                        opacity: geminiConfigured ? 0.95 : 0.85,
                        fontSize: 14,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Zap size={16} />
                      {wbsLoading ? '生成中…' : '文章から WBS を生成'}
                    </motion.button>
                    {!geminiConfigured && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => dispatch({ type: 'OPEN_SETTINGS' })}
                        style={{
                          marginTop: 8,
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: 'none',
                          background: tokens.colors.gradient.blue,
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        API キーを設定
                      </motion.button>
                    )}
                  </div>
                )}

                {wbsGenerated && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 12,
                      background: `${tokens.colors.accent.green}20`,
                      border: `1px solid ${tokens.colors.accent.green}40`,
                      color: tokens.colors.accent.green,
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <CheckSquare size={18} />
                    WBSを追加しました。タスクパネルで確認できます。
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {step === 'wbs' && wbsLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 16,
                background: 'rgba(248,249,250,0.92)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                zIndex: 20,
                padding: 24,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <Loader2 size={40} color={tokens.colors.accent.blue} strokeWidth={2.2} />
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: tokens.colors.text.primary }}>
                  {wbsGenKind === 'ai' ? 'Gemini で WBS を生成しています…' : 'WBS を作成しています…'}
                </div>
                <div style={{ fontSize: 12, color: tokens.colors.text.tertiary, marginTop: 6, lineHeight: 1.5 }}>
                  {wbsGenKind === 'ai'
                    ? 'タスク案を取得しています。数十秒かかることがあります。'
                    : 'テンプレートからプロジェクトを追加しています。'}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
