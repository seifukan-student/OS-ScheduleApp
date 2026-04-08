import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarEvent, WBSProject } from '../types'

export function buildCalendarContextForAi(events: CalendarEvent[], projects: WBSProject[]): string {
  const evLines = events
    .slice()
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(
      e =>
        `- ${e.title} | ${format(e.start, "yyyy-MM-dd HH:mm", { locale: ja })}〜${format(e.end, "HH:mm")} | 分類:${e.category} | 優先度:${e.priority}${e.description ? ` | ${e.description}` : ''}`
    )
    .join('\n')

  const taskLines = projects
    .flatMap(p =>
      p.tasks.map(
        t =>
          `- プロジェクト「${p.title}」: ${t.title} | 状態:${t.status} | 優先:${t.priority}${t.dueDate ? ` | 期限:${format(t.dueDate, "yyyy-MM-dd")}` : ''}${t.description ? ` | ${t.description}` : ''}`
      )
    )
    .join('\n')

  return [
    '## 現在の予定一覧',
    evLines || '（予定なし）',
    '',
    '## 現在のWBSタスク',
    taskLines || '（タスクなし）',
  ].join('\n')
}
