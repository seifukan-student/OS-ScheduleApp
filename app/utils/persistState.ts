import { CalendarEvent, WBSProject, ChatMessage, WBSTask, TeamMember, TeamProgressReport } from '../types'

const STORAGE_KEY = 'lumina_app_data_v2'

export interface PersistedAppSlice {
  events: CalendarEvent[]
  projects: WBSProject[]
  chatMessages: ChatMessage[]
  teamMembers?: TeamMember[]
  teamProgressReports?: TeamProgressReport[]
  selfMemberId?: string | null
}

function reviveTask(t: WBSTask): WBSTask {
  return {
    ...t,
    startDate: t.startDate ? new Date(t.startDate as unknown as string) : undefined,
    dueDate: t.dueDate ? new Date(t.dueDate as unknown as string) : undefined,
    completedAt: t.completedAt ? new Date(t.completedAt as unknown as string) : undefined,
  }
}

function reviveProject(p: WBSProject): WBSProject {
  return {
    ...p,
    tasks: (p.tasks || []).map(reviveTask),
    createdAt: new Date(p.createdAt as unknown as string),
    updatedAt: new Date(p.updatedAt as unknown as string),
    dueDate: p.dueDate ? new Date(p.dueDate as unknown as string) : undefined,
  }
}

function reviveEvent(e: CalendarEvent): CalendarEvent {
  return {
    ...e,
    start: new Date(e.start as unknown as string),
    end: new Date(e.end as unknown as string),
  }
}

function reviveMessage(m: ChatMessage): ChatMessage {
  return {
    ...m,
    timestamp: new Date(m.timestamp as unknown as string),
  }
}

function reviveTeamReport(r: TeamProgressReport): TeamProgressReport {
  return {
    ...r,
    at: new Date(r.at as unknown as string),
  }
}

export function loadPersistedAppData(): PersistedAppSlice | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedAppSlice
    if (!Array.isArray(data.events) || !Array.isArray(data.projects)) return null
    return {
      events: data.events.map(reviveEvent),
      projects: data.projects.map(reviveProject),
      chatMessages: Array.isArray(data.chatMessages) ? data.chatMessages.map(reviveMessage) : [],
      teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : undefined,
      teamProgressReports: Array.isArray(data.teamProgressReports)
        ? data.teamProgressReports.map(reviveTeamReport)
        : undefined,
      selfMemberId: data.selfMemberId ?? undefined,
    }
  } catch {
    return null
  }
}

export function savePersistedAppData(slice: PersistedAppSlice): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slice))
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedAppData(): void {
  localStorage.removeItem(STORAGE_KEY)
}
