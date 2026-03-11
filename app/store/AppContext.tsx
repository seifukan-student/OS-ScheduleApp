import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { AppState, CalendarEvent, WBSProject, ChatMessage, ViewMode, WBSTask } from '../types'
import { generateMockEvents, generateMockProjects, generateMockMessages } from '../utils/mockData'
import { addDays } from 'date-fns'

type Action =
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SELECT_PROJECT'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'SET_PANEL'; payload: 'calendar' | 'wbs' | 'both' }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'ADD_PROJECT'; payload: WBSProject }
  | { type: 'UPDATE_TASK'; payload: { projectId: string; task: WBSTask } }

const initialState: AppState = {
  currentDate: new Date(),
  viewMode: 'week',
  selectedEventId: null,
  selectedProjectId: null,
  sidebarOpen: true,
  chatOpen: false,
  events: generateMockEvents(),
  projects: generateMockProjects(),
  chatMessages: generateMockMessages(),
  activePanel: 'both',
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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
            ? {
                ...p,
                tasks: p.tasks.map(t =>
                  t.id === action.payload.task.id ? action.payload.task : t
                ),
              }
            : p
        ),
      }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export const useAppState = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
