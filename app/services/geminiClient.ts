import { getGeminiApiKey } from '../utils/aiConfig'
import { CalendarEvent } from '../types'
import { format, subDays } from 'date-fns'

/** 新しい順。404/非対応時は tryModels が次を試す */
const MODELS_TRY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
] as const

export type GeminiContent = { role: 'user' | 'model'; text: string }

type GenerateBody = {
  systemInstruction?: { parts: { text: string }[] }
  contents: { role: string; parts: { text: string }[] }[]
  generationConfig?: Record<string, unknown>
}

function readGenerateError(data: unknown): string {
  const d = data as {
    error?: { message?: string; status?: string }
    promptFeedback?: { blockReason?: string }
    candidates?: { finishReason?: string; safetyRatings?: unknown }[]
  }
  if (d?.error?.message) return d.error.message
  if (d?.promptFeedback?.blockReason) return `プロンプトがブロックされました: ${d.promptFeedback.blockReason}`
  const fr = d?.candidates?.[0]?.finishReason
  if (fr && fr !== 'STOP') return `生成が完了しませんでした: ${fr}`
  return '不明なエラー'
}

function extractTextFromResponse(data: unknown): string {
  const d = data as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const parts = d?.candidates?.[0]?.content?.parts
  if (!parts?.length) return ''
  return parts.map(p => p.text || '').join('').trim()
}

async function generateContent(
  apiKey: string,
  model: string,
  body: GenerateBody
): Promise<{ text: string; raw: unknown }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(readGenerateError(data) || `HTTP ${res.status}`)
  }
  const text = extractTextFromResponse(data)
  if (!text) {
    throw new Error(readGenerateError(data) || 'モデルからテキストがありません（安全性フィルタ等の可能性があります）')
  }
  return { text, raw: data }
}

/** ルートは OBJECT（一部モデルで ARRAY ルートが拒否されるため） */
const WBS_TASK_ITEM_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'タスク名（日本語・具体的）' },
    description: { type: 'STRING', description: '1行の補足' },
    priority: {
      type: 'STRING',
      enum: ['low', 'medium', 'high'],
    },
    daysBeforeEvent: {
      type: 'INTEGER',
      description: '開催日より何日前が目安期限か。0=当日',
    },
  },
  required: ['title'],
} as const

const WBS_TASKS_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    tasks: {
      type: 'ARRAY',
      items: WBS_TASK_ITEM_SCHEMA,
    },
  },
  required: ['tasks'],
} as const

export interface WbsTaskSuggestion {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: Date
}

/** WBS 生成時のオプション（経由地・文章による要件） */
export type WbsAiOptions = {
  /** メインの目標予定の前後で立ち寄る・通過する予定（カレンダーから選ぶ経由地） */
  viaEvents?: CalendarEvent[]
  /** ユーザーが書いた追加説明・要件（カレンダー以外の文脈） */
  userNotes?: string
}

function formatViaEventsSection(via: CalendarEvent[]): string {
  if (!via.length) return ''
  const sorted = [...via].sort((a, b) => a.start.getTime() - b.start.getTime())
  const lines = sorted.map(
    e =>
      `- ${e.title} | ${format(e.start, 'yyyy-MM-dd HH:mm')}〜${format(e.end, 'HH:mm')}${e.description ? ` | ${e.description}` : ''}`
  )
  return `

## 経由地・途中の関連予定（カレンダーで指定されたチェックポイント）
メインの目標予定とは別に、旅程・準備の途中で重要な予定です。移動・中継・前泊・リハーサル・打ち合わせなどに相当するタスクを織り交ぜ、時系列が自然になるようにしてください。
${lines.join('\n')}`
}

function formatUserNotesSection(notes: string): string {
  const t = notes.trim()
  if (!t) return ''
  return `

## ユーザーからの追加メモ・要件（文章）
以下の内容を必ず考慮してタスクを設計してください。
${t.slice(0, 8000)}`
}

function normalizePriority(p?: string): WbsTaskSuggestion['priority'] {
  const s = String(p || '').toLowerCase()
  if (s === 'low' || s === 'medium' || s === 'high') return s
  if (s === 'critical') return 'high'
  return 'medium'
}

function extractTaskArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { tasks?: unknown }).tasks)) {
    return (parsed as { tasks: unknown[] }).tasks
  }
  return []
}

function parseTasksFromJsonText(jsonText: string, eventStart: Date): WbsTaskSuggestion[] {
  let raw = jsonText.trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    const o = raw.indexOf('[')
    const c = raw.lastIndexOf(']')
    if (o < 0 || c <= o) throw new Error('JSON の解析に失敗しました')
    parsed = JSON.parse(raw.slice(o, c + 1)) as unknown
  }
  const arr = extractTaskArray(parsed)
  if (arr.length === 0 && !Array.isArray(parsed) && !(parsed && typeof parsed === 'object' && 'tasks' in (parsed as object))) {
    throw new Error('JSON に tasks 配列またはタスクの配列がありません')
  }
  return arr.map((raw) => {
    const item = raw as Record<string, unknown>
    const daysRaw = item.daysBeforeEvent
    const days = typeof daysRaw === 'number' && daysRaw >= 0 ? Math.floor(daysRaw) : undefined
    return {
      title: String(item.title || 'タスク'),
      description: item.description ? String(item.description) : undefined,
      priority: normalizePriority(String(item.priority)),
      dueDate: days !== undefined ? subDays(eventStart, days) : undefined,
    }
  })
}

/** 認可エラー以外は次のモデルを試す（404・スキーマ非対応・一時障害に対応） */
async function tryModels<T>(apiKey: string, fn: (model: string) => Promise<T>): Promise<T> {
  let lastErr: Error | null = null
  for (const model of MODELS_TRY) {
    try {
      return await fn(model)
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
      const m = lastErr.message.toLowerCase()
      if (m.includes('api key') || m.includes('permission denied') || m.includes('401') || m.includes('403')) {
        throw lastErr
      }
    }
  }
  throw lastErr || new Error('利用可能なモデルがありません')
}

/** WBS 用: structured JSON を優先、失敗時は自由テキストからパース */
export async function geminiSuggestWbsTasks(
  event: CalendarEvent,
  calendarContext: string,
  options?: WbsAiOptions
): Promise<WbsTaskSuggestion[]> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Gemini API キーが設定されていません（設定画面または VITE_GEMINI_API_KEY）')

  const viaSection = formatViaEventsSection(options?.viaEvents ?? [])
  const notesSection = formatUserNotesSection(options?.userNotes ?? '')

  const userPrompt = `対象イベント（メインのゴール）:
- 名前: ${event.title}
- 開催日時: ${format(event.start, 'yyyy-MM-dd HH:mm')}
- 説明: ${event.description || '（なし）'}
${viaSection}${notesSection}

同じカレンダー上の他予定・既存WBSの参考（重複や依存を意識してください）:
${calendarContext.slice(0, 4000)}

上記を踏まえ、メインの開催日に向けて成功に必要なタスクを 6〜14 件、時系列で具体化してください。経由地がある場合は、その前後の準備・移動・締切もタスクに含めてください。募集・告知・社内調整・リマインド・当日運営など、種類が偏らないようにしてください。`

  const systemText =
    'イベントとプロジェクトのWBSを設計する専門家です。daysBeforeEvent は「メインの開催日（対象イベントの開始日時）」を基準に、何日前が目安期限か（0〜整数）を付けてください。経由地予定がある場合は、その予定日の前後に必要な作業もタスクに含め、説明に経由地との関係を簡潔に書いてもよいです。'

  const structuredBody: GenerateBody = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: WBS_TASKS_JSON_SCHEMA,
    },
  }

  const freeformBody: GenerateBody = {
    systemInstruction: {
      parts: [
        {
          text: `${systemText} 出力は JSON のみ（前後に説明・マークダウン禁止）。`,
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${userPrompt}\n\n形式: {"tasks":[{"title":"...","description":"...","priority":"high|medium|low","daysBeforeEvent":数値},...]} またはタスクの JSON 配列のみ。`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
  }

  const mapParsed = (text: string) => {
    const tasks = parseTasksFromJsonText(text, event.start)
    if (tasks.length === 0) throw new Error('タスクが0件です')
    return tasks
  }

  try {
    const { text } = await tryModels(apiKey, model => generateContent(apiKey, model, structuredBody))
    return mapParsed(text)
  } catch {
    const { text } = await tryModels(apiKey, model => generateContent(apiKey, model, freeformBody))
    return mapParsed(text)
  }
}

/** チャット応答 */
export async function geminiChat(params: {
  apiKey: string
  systemInstruction: string
  contents: GeminiContent[]
}): Promise<string> {
  const body: GenerateBody = {
    systemInstruction: { parts: [{ text: params.systemInstruction }] },
    contents: params.contents.map(c => ({
      role: c.role === 'model' ? 'model' : 'user',
      parts: [{ text: c.text }],
    })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  }
  const { text } = await tryModels(params.apiKey, model => generateContent(params.apiKey, model, body))
  return text
}

export function chatMessagesToGeminiContents(
  messages: { role: string; content: string; typing?: boolean }[]
): GeminiContent[] {
  const filtered = messages.filter(
    m => !m.typing && m.content.trim() && (m.role === 'user' || m.role === 'assistant')
  )
  const out: GeminiContent[] = []
  for (const m of filtered) {
    out.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      text: m.content,
    })
  }
  while (out.length && out[0].role === 'model') out.shift()
  return out.slice(-24)
}
