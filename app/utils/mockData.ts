import { CalendarEvent, WBSProject, ChatMessage } from '../types'

/** 初回起動時・「データをデモに戻す」時の空の状態。サンプル予定は含みません。 */
export const generateMockEvents = (): CalendarEvent[] => []

export const generateMockProjects = (): WBSProject[] => []

export const generateMockMessages = (): ChatMessage[] => []
