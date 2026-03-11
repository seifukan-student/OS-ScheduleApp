import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Send, X, Minimize2, Maximize2, Paperclip, Mic,
  Calendar, CheckSquare, ArrowRight, RefreshCw, Sparkles,
  Bot, User, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { useAppState } from '../store/AppContext'
import { ChatMessage, ChatAction } from '../types'
import { tokens, glassStyle } from '../utils/design'

const AI_RESPONSES = [
  {
    trigger: ['今日', 'today', 'スケジュール'],
    response: '今日のスケジュールを確認しました 📅\n\n**本日の重要なイベント:**\n- 🔴 14:00 UI/UXレビュー（2時間）\n- 🟡 17:00 ウィークリーリトリート（1時間）\n\n**タスク進捗:**\n- フロントエンド実装: **65%** 完了 ✨\n- バックエンドAPI: **40%** 進行中\n\n今週中に完了すべき優先タスクはありますか？',
  },
  {
    trigger: ['WBS', 'wbs', '自動生成', 'タスク'],
    response: '**WBSを自動生成します** ⚡\n\n選択したイベントから以下のタスク構造を提案します：\n\n```\n📁 プロダクトローンチ\n├── 📋 要件定義 (2日)\n│   ├── ステークホルダーインタビュー\n│   └── 仕様書作成\n├── 🎨 デザイン (3日)\n│   ├── ワイヤーフレーム\n│   └── プロトタイプ\n├── 💻 開発 (7日)\n│   ├── フロントエンド\n│   └── バックエンド\n└── 🚀 ローンチ (1日)\n```\n\nこのWBSをプロジェクトに追加しますか？',
    actions: [
      { id: 'gen-wbs-1', label: 'WBSを追加する', type: 'create_wbs' as const },
      { id: 'gen-wbs-2', label: 'カスタマイズ', type: 'navigate' as const },
    ],
  },
  {
    trigger: ['最適化', 'optimize', '調整', '提案'],
    response: '**スケジュール最適化の提案** 🧠\n\nAI分析により以下の改善点を発見しました：\n\n1. **集中ブロック確保** — 火曜と木曜の9-12時をDeep Workとして確保することを推奨します\n\n2. **バッファ時間** — 重要ミーティング前後に30分のバッファを設定すると生産性が向上します\n\n3. **タスクバッチング** — コードレビューは週2回（月・木）にまとめると効率的です\n\n最適化を適用しますか？',
    actions: [
      { id: 'opt-1', label: '最適化を適用', type: 'create_event' as const },
    ],
  },
  {
    trigger: ['リマインダー', 'remind', '通知'],
    response: '**スマートリマインダーを設定します** 🔔\n\n優先度に基づいて以下のリマインダーを提案します：\n\n- **15分前**: Product Launch Planning\n- **1時間前**: Investor Meeting\n- **前日18:00**: 週次レポート提出\n\nまた、タスクの期限が近づいている場合は自動的にお知らせします。設定を確認しますか？',
  },
  {
    trigger: ['分析', 'analysis', 'レポート', '生産性'],
    response: '**今週の生産性分析** 📊\n\n```\n集中時間:  ████████░░  78%  ↑12%\nタスク完了: ██████░░░░  62%  →\nミーティング: ████░░░░░░  38%  ↓5%\n```\n\n**インサイト:**\n- Deep Workセッションを増やすと生産性が上がります\n- ミーティング時間が適切に管理されています\n- タスクの完了率を上げるため、小さく分割することを推奨します',
  },
]

const getAIResponse = (input: string): { response: string; actions?: ChatAction[] } => {
  const lower = input.toLowerCase()
  for (const r of AI_RESPONSES) {
    if (r.trigger.some(t => lower.includes(t))) {
      return { response: r.response, actions: r.actions }
    }
  }
  return {
    response: `**「${input}」について確認しました** ✨\n\n以下の対応が可能です：\n\n- 📅 関連イベントをカレンダーに追加\n- ✅ WBSタスクを自動生成\n- 🔔 リマインダーを設定\n- 📊 スケジュールを最適化\n\n具体的に何かお手伝いできることはありますか？`,
  }
}

const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
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
        boxShadow: isUser ? '0 4px 10px rgba(139,92,246,0.3)' : '0 4px 10px rgba(59,130,246,0.3)',
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chatMessages])

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

    // Typing indicator
    const typingMsg: ChatMessage = {
      id: `typing-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      typing: true,
    }
    setIsTyping(true)
    dispatch({ type: 'ADD_MESSAGE', payload: typingMsg })

    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))

    // Remove typing and add real response
    const { response, actions } = getAIResponse(content)
    const aiMsg: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      actions,
    }

    // Replace the last message (typing indicator) with real response
    dispatch({ type: 'ADD_MESSAGE', payload: aiMsg })
    setIsTyping(false)
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
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
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
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))',
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
          }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tokens.colors.text.primary }}>Lumina AI</div>
            <div style={{ fontSize: 11, color: tokens.colors.accent.green, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: tokens.colors.accent.green }} />
              オンライン
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
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))',
                    border: `1px solid rgba(59,130,246,0.2)`,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}
                >
                  <Sparkles size={24} color={tokens.colors.accent.blue} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: tokens.colors.text.primary, marginBottom: 4 }}>
                    Lumina AIへようこそ
                  </div>
                  <div style={{ fontSize: 12, color: tokens.colors.text.tertiary }}>
                    スケジュールの最適化、タスクの自動生成、分析など何でもお手伝いします
                  </div>
                </motion.div>
              )}

              {state.chatMessages
                .filter(m => !m.typing || m.id === state.chatMessages[state.chatMessages.length - 1]?.id)
                .map(msg => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
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
                  boxShadow: input.trim() && !isTyping ? '0 4px 12px rgba(59,130,246,0.35)' : 'none',
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
