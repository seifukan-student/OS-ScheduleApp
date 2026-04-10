// Core Type Definitions

export type ViewMode = 'month' | 'week' | 'day' | 'agenda'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked'
export type EventCategory = 'personal' | 'work' | 'project' | 'health' | 'social' | 'focus'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  allDay?: boolean
  category: EventCategory
  color: string
  location?: string
  attendees?: string[]
  wbsId?: string
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
  tags?: string[]
  priority: Priority
}

export interface WBSTask {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assignee?: string
  startDate?: Date
  dueDate?: Date
  completedAt?: Date
  estimatedHours?: number
  actualHours?: number
  progress: number // 0-100
  parentId?: string
  children?: string[]
  eventId?: string
  tags?: string[]
  dependencies?: string[]
  notes?: string
}

export interface WBSProject {
  id: string
  title: string
  description?: string
  color: string
  eventId?: string
  tasks: WBSTask[]
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  progress: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  typing?: boolean
  actions?: ChatAction[]
  metadata?: {
    relatedEventIds?: string[]
    relatedTaskIds?: string[]
    suggestions?: string[]
  }
}

export interface ChatAction {
  id: string
  label: string
  type: 'create_event' | 'create_wbs' | 'navigate' | 'filter'
  payload?: Record<string, unknown>
}

export interface TeamMember {
  id: string
  name: string
  role?: string
}

/** チーム画面での進捗報告（自分・メンバー共有用） */
export interface TeamProgressReport {
  id: string
  memberId: string
  text: string
  at: Date
}

export interface UserSettings {
  displayName: string
  theme: 'light' | 'dark'
  weekStartsOn: 0 | 1
  defaultView: ViewMode
  notificationsEnabled: boolean
  geminiApiKey: string
}

export interface AppState {
  currentDate: Date
  viewMode: ViewMode
  selectedEventId: string | null
  selectedProjectId: string | null
  sidebarOpen: boolean
  chatOpen: boolean
  events: CalendarEvent[]
  projects: WBSProject[]
  chatMessages: ChatMessage[]
  activePanel: 'calendar' | 'wbs' | 'both' | 'analytics' | 'team'
  createModalInitialDateTime: { date: string; start: string; end: string } | null
  createModalOpen: boolean
  createModalMode: 'choice' | 'event' | 'wbs'
  createModalPreselectedEventId: string | null
  searchOpen: boolean
  notificationsOpen: boolean
  settingsOpen: boolean
  editingEventId: string | null
  teamMembers: TeamMember[]
  teamProgressReports: TeamProgressReport[]
  /** 進捗報告時の「自分」として使うメンバー ID */
  selfMemberId: string | null
}
