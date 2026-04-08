import { format, isToday, isThisWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarEvent, WBSProject, ChatAction } from '../types'

export function getDemoAIResponse(
  input: string,
  events: CalendarEvent[],
  projects: WBSProject[]
): { response: string; actions?: ChatAction[] } {
  const lower = input.toLowerCase()

  if (lower.includes('今日') || lower.includes('today') || lower.includes('スケジュール')) {
    const todayEv = events.filter(e => isToday(e.start))
    const lines =
      todayEv.length === 0
        ? '本日の予定は登録されていません。'
        : todayEv
            .map(e => `- **${format(e.start, 'H:mm')}** ${e.title}`)
            .join('\n')
    const done = projects.reduce((a, p) => a + p.tasks.filter(t => t.status === 'done').length, 0)
    const total = projects.reduce((a, p) => a + p.tasks.length, 0)
    return {
      response: `**今日のスケジュール** 📅\n\n${lines}\n\n**タスク全体:** ${done} / ${total} 完了\n\n（APIキー未設定のためデモ応答です。設定で Gemini を有効にすると実データに基づく回答が得られます。）`,
    }
  }

  if (lower.includes('wbs') || lower.includes('自動生成') || lower.includes('タスク')) {
    return {
      response:
        '**WBS について**\n\n左の「新規作成」→「イベントからWBSを作成」でテンプレートまたは AI によるタスク案を追加できます。\n\n（Gemini API を設定している場合は、イベントに合わせたタスクが生成されます。）',
      actions: [
        { id: 'gen-wbs-1', label: 'WBS作成を開く', type: 'create_wbs' as const },
        { id: 'gen-wbs-2', label: '週表示へ', type: 'navigate' as const, payload: { view: 'week' } },
      ],
    }
  }

  if (lower.includes('最適化') || lower.includes('optimize') || lower.includes('調整') || lower.includes('提案')) {
    return {
      response:
        '**スケジュールのヒント** 🧠\n\n- 重要な予定の前後に移動・準備の余白を置く\n- 週の初めにWBSの優先度を見直す\n\n（AI による詳細提案は Gemini 接続時に利用できます。）',
      actions: [{ id: 'opt-1', label: '予定を追加', type: 'create_event' as const }],
    }
  }

  if (lower.includes('リマインダー') || lower.includes('remind') || lower.includes('通知')) {
    return {
      response:
        '**リマインダー**\n\n通知パネル（ベルアイコン）でお知らせを確認できます。リマインド内容の自動生成は Gemini 接続時に強化されます。',
    }
  }

  if (lower.includes('分析') || lower.includes('analysis') || lower.includes('レポート') || lower.includes('生産性')) {
    const weekEv = events.filter(e => isThisWeek(e.start, { weekStartsOn: 1 }))
    return {
      response: `**今週のざっくり集計** 📊\n\n- 今週の予定: **${weekEv.length}** 件\n- プロジェクト: **${projects.length}** 件\n\n詳しいチャートはサイドバーの「分析」を開いてください。`,
    }
  }

  return {
    response: `**「${input}」**\n\nAPIキーがない場合はデモ応答のみです。**設定**から Gemini API キーを保存すると、このチャットで実際の AI 応答が使えます。\n\n- 予定の確認・提案のヒント\n- WBS・イベント運営の相談`,
  }
}
