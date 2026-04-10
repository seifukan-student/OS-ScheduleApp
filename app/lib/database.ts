import { supabase } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CalendarEvent, WBSProject, WBSTask, TeamMember, UserSettings } from '../types'

function sb(): SupabaseClient {
  if (!supabase) throw new Error('Supabase が未設定です（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）')
  return supabase
}

/* ──────────────────────── helpers ──────────────────────── */

function toIso(d: Date | undefined | null): string | null {
  return d ? d.toISOString() : null
}

function fromIso(s: string | null | undefined): Date | undefined {
  if (!s) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/* ──────────────────────── Events ──────────────────────── */

interface EventRow {
  id: string
  user_id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  all_day: boolean
  category: string
  color: string
  location: string | null
  attendees: string[] | null
  wbs_id: string | null
  recurring: string | null
  tags: string[] | null
  priority: string
}

function rowToEvent(r: EventRow): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    start: new Date(r.start_at),
    end: new Date(r.end_at),
    allDay: r.all_day,
    category: r.category as CalendarEvent['category'],
    color: r.color,
    location: r.location ?? undefined,
    attendees: r.attendees ?? undefined,
    wbsId: r.wbs_id ?? undefined,
    recurring: (r.recurring ?? 'none') as CalendarEvent['recurring'],
    tags: r.tags ?? undefined,
    priority: r.priority as CalendarEvent['priority'],
  }
}

export async function fetchEvents(userId: string): Promise<CalendarEvent[]> {
  const { data, error } = await sb()
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('start_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToEvent)
}

export async function upsertEvent(userId: string, e: CalendarEvent) {
  const row = {
    id: e.id,
    user_id: userId,
    title: e.title,
    description: e.description ?? null,
    start_at: e.start.toISOString(),
    end_at: e.end.toISOString(),
    all_day: e.allDay ?? false,
    category: e.category,
    color: e.color,
    location: e.location ?? null,
    attendees: e.attendees ?? null,
    wbs_id: e.wbsId ?? null,
    recurring: e.recurring ?? 'none',
    tags: e.tags ?? null,
    priority: e.priority,
  }
  const { error } = await sb().from('events').upsert(row, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteEvent(eventId: string) {
  const { error } = await sb().from('events').delete().eq('id', eventId)
  if (error) throw error
}

/* ──────────────────────── Projects ──────────────────────── */

interface ProjectRow {
  id: string
  user_id: string
  title: string
  description: string | null
  color: string
  event_id: string | null
  created_at: string
  updated_at: string
  due_date: string | null
  progress: number
}

function rowToProject(r: ProjectRow, tasks: WBSTask[]): WBSProject {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    color: r.color,
    eventId: r.event_id ?? undefined,
    tasks,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    dueDate: fromIso(r.due_date),
    progress: r.progress,
  }
}

interface TaskRow {
  id: string
  project_id: string
  title: string
  description: string | null
  status: string
  priority: string
  assignee: string | null
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  estimated_hours: number | null
  actual_hours: number | null
  progress: number
  parent_id: string | null
  children: string[] | null
  event_id: string | null
  tags: string[] | null
  dependencies: string[] | null
  notes: string | null
  sort_order: number
}

function rowToTask(r: TaskRow): WBSTask {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status as WBSTask['status'],
    priority: r.priority as WBSTask['priority'],
    assignee: r.assignee ?? undefined,
    startDate: fromIso(r.start_date),
    dueDate: fromIso(r.due_date),
    completedAt: fromIso(r.completed_at),
    estimatedHours: r.estimated_hours ?? undefined,
    actualHours: r.actual_hours ?? undefined,
    progress: r.progress,
    parentId: r.parent_id ?? undefined,
    children: r.children ?? undefined,
    eventId: r.event_id ?? undefined,
    tags: r.tags ?? undefined,
    dependencies: r.dependencies ?? undefined,
    notes: r.notes ?? undefined,
  }
}

export async function fetchProjects(userId: string): Promise<WBSProject[]> {
  const { data: projRows, error: pe } = await sb()
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (pe) throw pe

  const projList = projRows ?? []
  if (projList.length === 0) return []

  const { data: taskRows, error: te } = await sb()
    .from('tasks')
    .select('*')
    .in('project_id', projList.map(p => p.id))
    .order('sort_order', { ascending: true })
  if (te) throw te

  const tasksByProject = new Map<string, WBSTask[]>()
  for (const t of taskRows ?? []) {
    const list = tasksByProject.get(t.project_id) ?? []
    list.push(rowToTask(t))
    tasksByProject.set(t.project_id, list)
  }

  return projList.map(r => rowToProject(r, tasksByProject.get(r.id) ?? []))
}

export async function upsertProject(userId: string, p: WBSProject) {
  const row = {
    id: p.id,
    user_id: userId,
    title: p.title,
    description: p.description ?? null,
    color: p.color,
    event_id: p.eventId ?? null,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    due_date: toIso(p.dueDate),
    progress: p.progress,
  }
  const { error } = await sb().from('projects').upsert(row, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteProject(projectId: string) {
  await sb().from('tasks').delete().eq('project_id', projectId)
  const { error } = await sb().from('projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function upsertTask(projectId: string, t: WBSTask, sortOrder: number) {
  const row = {
    id: t.id,
    project_id: projectId,
    title: t.title,
    description: t.description ?? null,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee ?? null,
    start_date: toIso(t.startDate),
    due_date: toIso(t.dueDate),
    completed_at: toIso(t.completedAt),
    estimated_hours: t.estimatedHours ?? null,
    actual_hours: t.actualHours ?? null,
    progress: t.progress,
    parent_id: t.parentId ?? null,
    children: t.children ?? null,
    event_id: t.eventId ?? null,
    tags: t.tags ?? null,
    dependencies: t.dependencies ?? null,
    notes: t.notes ?? null,
    sort_order: sortOrder,
  }
  const { error } = await sb().from('tasks').upsert(row, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteTask(taskId: string) {
  const { error } = await sb().from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

/* ──────────────────────── User Settings ──────────────────────── */

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await sb()
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    displayName: data.display_name ?? '',
    theme: data.theme ?? 'light',
    weekStartsOn: data.week_starts_on ?? 1,
    defaultView: data.default_view ?? 'week',
    notificationsEnabled: data.notifications_enabled ?? true,
    geminiApiKey: data.gemini_api_key ?? '',
  }
}

export async function saveUserSettings(userId: string, s: UserSettings) {
  const row = {
    user_id: userId,
    display_name: s.displayName,
    theme: s.theme,
    week_starts_on: s.weekStartsOn,
    default_view: s.defaultView,
    notifications_enabled: s.notificationsEnabled,
    gemini_api_key: s.geminiApiKey,
  }
  const { error } = await sb().from('user_settings').upsert(row, { onConflict: 'user_id' })
  if (error) throw error
}

/* ──────────────────────── Team Members ──────────────────────── */

export async function fetchTeamMembers(userId: string): Promise<TeamMember[]> {
  const { data, error } = await sb().from('team_members').select('*').eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, name: r.name, role: r.role ?? undefined }))
}

export async function upsertTeamMember(userId: string, m: TeamMember) {
  const { error } = await sb().from('team_members').upsert({
    id: m.id, user_id: userId, name: m.name, role: m.role ?? null,
  }, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteTeamMember(memberId: string) {
  const { error } = await sb().from('team_members').delete().eq('id', memberId)
  if (error) throw error
}
