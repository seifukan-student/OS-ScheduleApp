import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef, useCallback } from 'react'
import {
  AppState,
  CalendarEvent,
  WBSProject,
  ChatMessage,
  ViewMode,
  WBSTask,
  TeamMember,
  TeamProgressReport,
} from '../types'
import { generateMockMessages } from '../utils/mockData'
import { useAuth } from '../auth/AuthContext'
import {
  fetchEvents,
  fetchProjects,
  fetchTeamMembers,
  upsertEvent,
  deleteEvent as dbDeleteEvent,
  upsertProject,
  deleteProject as dbDeleteProject,
  upsertTask,
  deleteTask as dbDeleteTask,
  upsertTeamMember,
  deleteTeamMember as dbDeleteTeamMember,
} from '../lib/database'

type Action =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SELECT_PROJECT'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'SET_PANEL'; payload: AppState['activePanel'] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'ADD_PROJECT'; payload: WBSProject }
  | { type: 'REMOVE_EVENT'; payload: string }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_TASK'; payload: { projectId: string; task: WBSTask } }
  | { type: 'ADD_TASK'; payload: { projectId: string; task: WBSTask } }
  | { type: 'DELETE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'UPDATE_PROJECT'; payload: WBSProject }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'OPEN_CREATE_MODAL'; payload?: { mode?: 'choice' | 'event' | 'wbs'; preselectedEventId?: string | null; editingEventId?: string | null; initialDateTime?: { date: string; start: string; end: string } | null } }
  | { type: 'CLOSE_CREATE_MODAL' }
  | { type: 'OPEN_SEARCH' }
  | { type: 'CLOSE_SEARCH' }
  | { type: 'OPEN_NOTIFICATIONS' }
  | { type: 'CLOSE_NOTIFICATIONS' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'SET_EDITING_EVENT'; payload: string | null }
  | { type: 'RESET_TO_DEMO_DATA' }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'DELETE_TEAM_MEMBER'; payload: string }
  | { type: 'SET_SELF_MEMBER_ID'; payload: string | null }
  | { type: 'ADD_TEAM_PROGRESS_REPORT'; payload: TeamProgressReport }
  | { type: 'LOAD_REMOTE_DATA'; payload: { events: CalendarEvent[]; projects: WBSProject[]; teamMembers: TeamMember[] } }

const initialState: AppState = {
  currentDate: new Date(),
  viewMode: 'week',
  selectedEventId: null,
  selectedProjectId: null,
  sidebarOpen: true,
  chatOpen: false,
  events: [],
  projects: [],
  chatMessages: generateMockMessages(),
  activePanel: 'both',
  createModalOpen: false,
  createModalMode: 'choice',
  createModalPreselectedEventId: null,
  createModalInitialDateTime: null,
  searchOpen: false,
  notificationsOpen: false,
  settingsOpen: false,
  editingEventId: null,
  teamMembers: [],
  teamProgressReports: [],
  selfMemberId: null,
}

function deriveProgress(tasks: WBSTask[]): number {
  if (tasks.length === 0) return 0
  return Math.round(tasks.reduce((s, t) => s + (t.status === 'done' ? 100 : t.progress), 0) / tasks.length)
}

function withProgress(p: WBSProject): WBSProject {
  return { ...p, progress: deriveProgress(p.tasks) }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_REMOTE_DATA':
      return { ...state, events: action.payload.events, projects: action.payload.projects, teamMembers: action.payload.teamMembers }
    case 'SET_VIEW':
      return { ...state, viewMode: action.payload }
    case 'SET_DATE':
      return { ...state, currentDate: action.payload }
    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload }
    case 'SELECT_PROJECT':
      return { ...state, selectedProjectId: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'TOGGLE_CHAT':
      return { ...state, chatOpen: !state.chatOpen }
    case 'SET_PANEL':
      return { ...state, activePanel: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] }
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? withProgress({ ...p, tasks: p.tasks.map(t => t.id === action.payload.task.id ? action.payload.task : t) })
            : p
        ),
      }
    case 'ADD_TASK':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? withProgress({ ...p, tasks: [...p.tasks, action.payload.task] })
            : p
        ),
      }
    case 'DELETE_TASK':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? withProgress({ ...p, tasks: p.tasks.filter(t => t.id !== action.payload.taskId) })
            : p
        ),
      }
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => (p.id === action.payload.id ? action.payload : p)) }
    case 'DELETE_PROJECT': {
      const id = action.payload
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== id),
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        events: state.events.map(e => (e.wbsId === id ? { ...e, wbsId: undefined } : e)),
      }
    }
    case 'REMOVE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
        selectedEventId: state.selectedEventId === action.payload ? null : state.selectedEventId,
      }
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map(e => (e.id === action.payload.id ? action.payload : e)), editingEventId: null }
    case 'OPEN_CREATE_MODAL': {
      const p = action.payload
      return {
        ...state, createModalOpen: true,
        createModalMode: p?.mode ?? 'choice',
        createModalPreselectedEventId: p?.preselectedEventId ?? null,
        editingEventId: p?.editingEventId !== undefined ? p.editingEventId : null,
        createModalInitialDateTime: p?.initialDateTime !== undefined ? p.initialDateTime : null,
      }
    }
    case 'CLOSE_CREATE_MODAL':
      return { ...state, createModalOpen: false, createModalMode: 'choice', createModalPreselectedEventId: null, editingEventId: null, createModalInitialDateTime: null }
    case 'OPEN_SEARCH':
      return { ...state, searchOpen: true }
    case 'CLOSE_SEARCH':
      return { ...state, searchOpen: false }
    case 'OPEN_NOTIFICATIONS':
      return { ...state, notificationsOpen: true }
    case 'CLOSE_NOTIFICATIONS':
      return { ...state, notificationsOpen: false }
    case 'OPEN_SETTINGS':
      return { ...state, settingsOpen: true }
    case 'CLOSE_SETTINGS':
      return { ...state, settingsOpen: false }
    case 'SET_EDITING_EVENT':
      return { ...state, editingEventId: action.payload }
    case 'ADD_TEAM_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.payload] }
    case 'UPDATE_TEAM_MEMBER': {
      const prev = state.teamMembers.find(m => m.id === action.payload.id)
      const nextName = action.payload.name.trim()
      let projects = state.projects
      if (prev && prev.name !== nextName) {
        projects = state.projects.map(p => ({
          ...p,
          tasks: p.tasks.map(t => {
            if (!t.assignee) return t
            if (t.assignee === prev.name || t.assignee === prev.id) return { ...t, assignee: nextName }
            return t
          }),
        }))
      }
      return {
        ...state, projects,
        teamMembers: state.teamMembers.map(m => (m.id === action.payload.id ? action.payload : m)),
        selfMemberId: state.selfMemberId === action.payload.id ? action.payload.id : state.selfMemberId,
      }
    }
    case 'DELETE_TEAM_MEMBER': {
      const m = state.teamMembers.find(x => x.id === action.payload)
      const projects = m
        ? state.projects.map(p => ({ ...p, tasks: p.tasks.map(t => (!t.assignee ? t : (t.assignee === m.name || t.assignee === m.id) ? { ...t, assignee: undefined } : t)) }))
        : state.projects
      return {
        ...state,
        teamMembers: state.teamMembers.filter(x => x.id !== action.payload),
        teamProgressReports: state.teamProgressReports.filter(r => r.memberId !== action.payload),
        selfMemberId: state.selfMemberId === action.payload ? null : state.selfMemberId,
        projects,
      }
    }
    case 'SET_SELF_MEMBER_ID':
      return { ...state, selfMemberId: action.payload }
    case 'ADD_TEAM_PROGRESS_REPORT':
      return { ...state, teamProgressReports: [action.payload, ...state.teamProgressReports].slice(0, 200) }
    case 'RESET_TO_DEMO_DATA':
      return { ...state, events: [], projects: [], chatMessages: generateMockMessages(), selectedEventId: null, selectedProjectId: null, teamMembers: [], teamProgressReports: [], selfMemberId: null }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [state, rawDispatch] = useReducer(reducer, initialState)
  const userId = user?.id
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!userId || loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      try {
        const [events, projects, teamMembers] = await Promise.all([
          fetchEvents(userId),
          fetchProjects(userId),
          fetchTeamMembers(userId),
        ])
        rawDispatch({ type: 'LOAD_REMOTE_DATA', payload: { events, projects, teamMembers } })
      } catch (err) {
        console.error('[db] initial load failed', err)
      }
    })()
  }, [userId])

  const dispatch = useCallback((action: Action) => {
    rawDispatch(action)
    if (!userId) return

    // fire-and-forget DB sync
    switch (action.type) {
      case 'ADD_EVENT':
      case 'UPDATE_EVENT':
        upsertEvent(userId, action.payload).catch(e => console.error('[db]', e))
        break
      case 'REMOVE_EVENT':
        dbDeleteEvent(action.payload).catch(e => console.error('[db]', e))
        break
      case 'ADD_PROJECT':
        upsertProject(userId, action.payload).catch(e => console.error('[db]', e))
        action.payload.tasks.forEach((t, i) => upsertTask(action.payload.id, t, i).catch(e => console.error('[db]', e)))
        break
      case 'UPDATE_PROJECT':
        upsertProject(userId, action.payload).catch(e => console.error('[db]', e))
        break
      case 'DELETE_PROJECT':
        dbDeleteProject(action.payload).catch(e => console.error('[db]', e))
        break
      case 'ADD_TASK':
        upsertTask(action.payload.projectId, action.payload.task, Date.now()).catch(e => console.error('[db]', e))
        break
      case 'UPDATE_TASK':
        upsertTask(action.payload.projectId, action.payload.task, Date.now()).catch(e => console.error('[db]', e))
        break
      case 'DELETE_TASK':
        dbDeleteTask(action.payload.taskId).catch(e => console.error('[db]', e))
        break
      case 'ADD_TEAM_MEMBER':
        upsertTeamMember(userId, action.payload).catch(e => console.error('[db]', e))
        break
      case 'UPDATE_TEAM_MEMBER':
        upsertTeamMember(userId, action.payload).catch(e => console.error('[db]', e))
        break
      case 'DELETE_TEAM_MEMBER':
        dbDeleteTeamMember(action.payload).catch(e => console.error('[db]', e))
        break
    }
  }, [userId])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export const useAppState = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
