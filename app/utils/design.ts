// Design Tokens - Apple-inspired Design System
export const tokens = {
  colors: {
    bg: {
      primary: '#0a0a0f',
      secondary: '#111118',
      tertiary: '#16161f',
      card: '#1a1a24',
      cardHover: '#1e1e2a',
      overlay: 'rgba(10,10,15,0.8)',
    },
    border: {
      subtle: 'rgba(255,255,255,0.06)',
      default: 'rgba(255,255,255,0.1)',
      strong: 'rgba(255,255,255,0.18)',
    },
    text: {
      primary: '#f5f5f7',
      secondary: '#a1a1aa',
      tertiary: '#71717a',
      accent: '#60a5fa',
    },
    accent: {
      blue: '#3B82F6',
      purple: '#8B5CF6',
      amber: '#F59E0B',
      green: '#10B981',
      pink: '#EC4899',
      indigo: '#6366F1',
      red: '#EF4444',
    },
    gradient: {
      blue: 'linear-gradient(135deg, #3B82F6, #6366F1)',
      purple: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      amber: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      green: 'linear-gradient(135deg, #10B981, #3B82F6)',
    },
    category: {
      work: '#3B82F6',
      personal: '#8B5CF6',
      project: '#F59E0B',
      health: '#10B981',
      social: '#EC4899',
      focus: '#6366F1',
    },
    priority: {
      low: '#71717a',
      medium: '#F59E0B',
      high: '#3B82F6',
      critical: '#EF4444',
    },
    status: {
      todo: '#71717a',
      in_progress: '#3B82F6',
      done: '#10B981',
      blocked: '#EF4444',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '24px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.4)',
    md: '0 4px 12px rgba(0,0,0,0.4)',
    lg: '0 8px 32px rgba(0,0,0,0.5)',
    glow: {
      blue: '0 0 20px rgba(59,130,246,0.3)',
      purple: '0 0 20px rgba(139,92,246,0.3)',
      green: '0 0 20px rgba(16,185,129,0.3)',
    },
  },
  animation: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
}

export const glassStyle = {
  background: 'rgba(26, 26, 36, 0.7)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${tokens.colors.border.subtle}`,
}

export const categoryLabels: Record<string, string> = {
  work: 'ワーク',
  personal: 'プライベート',
  project: 'プロジェクト',
  health: 'ヘルス',
  social: 'ソーシャル',
  focus: 'フォーカス',
}

export const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '緊急',
}

export const statusLabels: Record<string, string> = {
  todo: 'ToDo',
  in_progress: '進行中',
  done: '完了',
  blocked: 'ブロック中',
}
