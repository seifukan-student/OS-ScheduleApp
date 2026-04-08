import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Send, X, Minimize2, Maximize2, Paperclip, Mic,
  Calendar, CheckSquare, ArrowRight, RefreshCw, Sparkles,
  Bot, User, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { useAppState } from '../store/AppContext'
import { ChatMessage, ChatAction } from '../types'
import { tokens } from '../utils/design'
import { getGeminiApiKey, isGeminiConfigured } from '../utils/aiConfig'
import { buildCalendarContextForAi } from '../utils/buildAiContext'
import { getDemoAIResponse } from '../utils/demoAiResponses'
import { geminiChat, chatMessagesToGeminiContents } from '../services/geminiClient'

const MessageBubble: React.FC<{ msg: ChatMessage; onAction?: (action: ChatAction) => void }> = ({ msg, onAction }) => {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 8,
        alignItems: 'flex-start',
        marginBottom: 16,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: isUser
          ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
          : 'linear-gradient(135deg, #3B82F6, #6366F1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: tokens.shadow.sm,
      }}>
        {isUser ? <User size={14} color="#fff" /> : <Zap size={14} color="#fff" fill="#fff" />}
      </div>

      <div style={{ maxWidth: '85%' }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          background: isUser
            ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(236,72,153,0.25))'
            : tokens.colors.bg.card,
          border: `1px solid ${isUser ? 'rgba(139,92,246,0.3)' : tokens.colors.border.subtle}`,
          fontSize: 13,
          lineHeight: 1.6,
          color: tokens.colors.text.primary,
        }}>
          {msg.typing ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: tokens.colors.accent.blue }}
                />
              ))}
            </div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {msg.content.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <div key={i} style={{ fontWeight: 700, color: tokens.colors.text.primary, marginBottom: 4 }}>{line.replace(/\*\*/g, '')}</div>
                }
                if (line.startsWith('- ')) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: tokens.colors.accent.blue, fontSize: 12 }}>•</span>
                      <span>{line.slice(2)}</span>
                    </div>
                  )
                }
                if (line.startsWith('```') || line.startsWith('├') || line.startsWith('└') || line.startsWith('│')) {
                  return <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: tokens.colors.accent.blue, marginBottom: 2 }}>{line}</div>
                }
                return <div key={i} style={{ marginBottom: line ? 2 : 6 }}>{line}</div>
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {msg.actions && msg.actions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {msg.actions.map(action => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onAction?.(action)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: `1px solid ${tokens.colors.accent.blue}40`,
                  background: `${tokens.colors.accent.blue}10`,
                  color: tokens.colors.accent.blue,
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <ArrowRight size={11} />
                {action.label}
              </motion.button>
            ))}
          </div>
        )}

        <div style={{ fontSize: 10, color: tokens.colors.text.tertiary, marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {format(msg.timestamp, 'H:mm')}
        </div>
      </div>
    </motion.div>
  )
}

const SUGGESTIONS = [
  '今日のスケジュールを最適化して',
  'プロジェクトのWBSを自動生成',
  '今週の生産性を分析して',
  'リマインダーを設定して',
]

export const AIChat: React.FC = () => {
  const { state, dispatch } = useAppState()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [aiLive, setAiLive] = useState(() => isGeminiConfigured())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onStorage = () => setAiLive(isGeminiConfigured())
    window.addEventListener('storage', onStorage)
    window.addEventListener('lumina-api-key', onStorage as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('lumina-api-key', onStorage as EventListener)
    }
  }, [])

  const handleChatAction = (action: ChatAction) => {
    if (action.type === 'navigate' && action.payload?.view) {
      dispatch({ type: 'SET_VIEW', payload: action.payload.view as 'month' | 'week' | 'day' | 'agenda' })
    }
    if (action.type === 'create_wbs') {
      dispatch({ type: 'OPEN_CREATE_MODAL', payload: { mode: 'wbs' } })
      dispatch({ type: 'SET_PANEL', payload: 'both' })
    }
    if (action.type === 'create_event') {
      dispatch({ type: 'OPEN_CREATE_MODAL', payload: { mode: 'event' } })
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chatMessages, isTyping])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content) return
    setInput('')

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg })

    setIsTyping(true)
    const apiKey = getGeminiApiKey()
    setAiLive(!!apiKey)

    try {
      let response: string
      let actions: ChatAction[] | undefined

      if (apiKey) {
        const calendarBlock = buildCalendarContextForAi(state.events, state.projects)
        const systemInstruction = [
          'あなたは Lumina（カレンダー兼WBS）の日本語アシスタントです。',
          'ユーザーの予定・タスクを尊重し、実践的な提案を短めに返答してください。マークダウン（見出し・箇条書き）を使ってよいです。',
          'キーやパスワードの要求はしません。',
          '',
          calendarBlock,
        ].join('\n')

        const prior = chatMessagesToGeminiContents(
          [...state.chatMessages, userMsg].filter(
            m => (m.role === 'user' || m.role === 'assistant') && !m.typing && m.content.trim()
          )
        )
        response = await geminiChat({
          apiKey,
          systemInstruction,
          contents: prior,
        })
      } else {
        await new Promise(r => setTimeout(r, 350))
        const demo = getDemoAIResponse(content, state.events, state.projects)
        response = demo.response
        actions = demo.actions
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        actions,
      }
      dispatch({ type: 'ADD_MESSAGE', payload: aiMsg })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'エラーが発生しました'
      const demo = getDemoAIResponse(content, state.events, state.projects)
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: `**Gemini 応答エラー**\n\n${msg}\n\nAPIキーやネットワークを確認してください。とりあえずデモ応答を表示します。\n\n---\n\n${demo.response}`,
          timestamp: new Date(),
          actions: demo.actions,
        },
      })
    } finally {
      setIsTyping(false)
    }
  }

  if (!state.chatOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 380,
          height: minimized ? 60 : 580,
          borderRadius: 20,
          background: tokens.colors.bg.secondary,
          border: `1px solid ${tokens.colors.border.default}`,
          boxShadow: tokens.shadow.lg,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1000,
          transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Chat Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: minimized ? 'none' : `1px solid ${tokens.colors.border.subtle}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(26,115,232,0.06)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: tokens.shadow.sm,
          }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.text.primary }}>Lumina AI</div>
            <div style={{ fontSize: 11, color: aiLive ? tokens.colors.accent.green : tokens.colors.text.tertiary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: aiLive ? tokens.colors.accent.green : tokens.colors.text.tertiary }} />
              {aiLive ? 'Gemini 接続' : 'デモモード'}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setMinimized(!minimized)}
            style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer' }}
          >
            {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
            style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: tokens.colors.text.secondary, cursor: 'pointer' }}
          >
            <X size={16} />
          </motion.button>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }} className="custom-scrollbar">
              {/* Welcome card */}
              {state.chatMessages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '16px',
                    borderRadius: 14,
                    background: 'rgba(26,115,232,0.06)',
                    border: `1px solid ${tokens.colors.border.default}`,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}
                >
                  <Sparkles size={24} color={tokens.colors.accent.blue} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary, marginBottom: 4 }}>
                    Lumina AIへようこそ
                  </div>
                  <div style={{ fontSize: 12, color: tokens.colors.text.tertiary }}>
                    設定で Gemini API キーを入れると会話が本番モードになります。未設定時はデモ応答です。
                  </div>
                </motion.div>
              )}

              {state.chatMessages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} onAction={handleChatAction} />
              ))}
              {isTyping && (
                <MessageBubble
                  msg={{
                    id: 'typing',
                    role: 'assistant',
                    content: '',
                    timestamp: new Date(),
                    typing: true,
                  }}
                />
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {state.chatMessages.length <= 1 && (
              <div style={{
                padding: '0 12px 8px',
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}>
                {SUGGESTIONS.map(s => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendMessage(s)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: `1px solid ${tokens.colors.border.default}`,
                      background: tokens.colors.bg.card,
                      color: tokens.colors.text.secondary,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '12px',
              borderTop: `1px solid ${tokens.colors.border.subtle}`,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}>
              <div style={{
                flex: 1,
                background: tokens.colors.bg.card,
                border: `1px solid ${tokens.colors.border.default}`,
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="AIに質問してください..."
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: tokens.colors.text.primary,
                    fontSize: 13,
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.colors.text.tertiary, padding: 0 }}
                >
                  <Mic size={15} />
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: input.trim() && !isTyping
                    ? 'linear-gradient(135deg, #3B82F6, #6366F1)'
                    : tokens.colors.bg.card,
                  border: `1px solid ${tokens.colors.border.default}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                  boxShadow: input.trim() && !isTyping ? tokens.shadow.sm : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {isTyping ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw size={15} color={tokens.colors.text.tertiary} />
                  </motion.div>
                ) : (
                  <Send size={15} color={input.trim() ? '#fff' : tokens.colors.text.tertiary} />
                )}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
