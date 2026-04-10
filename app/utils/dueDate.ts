import { isBefore, startOfDay } from 'date-fns'

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * `yyyy-MM-dd` をローカル暦の正午として解釈する（`new Date("yyyy-MM-dd")` の UTC 解釈による前日ずれを防ぐ）。
 */
export function parseLocalDateYMD(ymd: string): Date {
  const m = YMD.exec(ymd.trim())
  if (!m) {
    const d = new Date(ymd)
    return Number.isNaN(d.getTime()) ? new Date() : d
  }
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const day = Number(m[3])
  return new Date(y, mo, day, 12, 0, 0, 0)
}

/**
 * localStorage 等から復元する日付。ISO の日付のみ文字列はローカル暦で解釈する。
 */
export function parsePersistedDate(value: unknown): Date | undefined {
  if (value == null || value === '') return undefined
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
  const s = String(value)
  if (YMD.test(s)) return parseLocalDateYMD(s)
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/**
 * 期限が「カレンダー上で今日より前」か。当日は期限超過にしない（時刻は無視）。
 */
export function isDueDateOverdue(due: Date, now: Date = new Date()): boolean {
  return isBefore(startOfDay(due), startOfDay(now))
}
