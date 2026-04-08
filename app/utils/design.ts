// Design Tokens - Gemini / Google-style Light Theme
export const tokens = {
  colors: {
    bg: {
      primary: '#f8f9fa',
      secondary: '#ffffff',
      tertiary: '#f1f3f4',
      card: '#ffffff',
      cardHover: '#f8f9fa',
      overlay: 'rgba(32,33,36,0.6)',
    },
    border: {
      subtle: 'rgba(0,0,0,0.06)',
      default: '#dadce0',
      strong: 'rgba(0,0,0,0.2)',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
      tertiary: '#80868b',
      accent: '#1a73e8',
    },
    accent: {
      blue: '#1a73e8',
      purple: '#9334e6',
      amber: '#f9ab00',
      green: '#137333',
      pink: '#d93025',
      indigo: '#1967d2',
      red: '#d93025',
    },
    gradient: {
      blue: 'linear-gradient(135deg, #1a73e8, #1967d2)',
      purple: 'linear-gradient(135deg, #9334e6, #7c2dd4)',
      amber: 'linear-gradient(135deg, #f9ab00, #ea4335)',
      green: 'linear-gradient(135deg, #137333, #1a73e8)',
    },
    category: {
      work: '#1a73e8',
      personal: '#9334e6',
      project: '#f9ab00',
      health: '#137333',
      social: '#ea4335',
      focus: '#1967d2',
    },
    priority: {
      low: '#5f6368',
      medium: '#f9ab00',
      high: '#1a73e8',
      critical: '#d93025',
    },
    status: {
      todo: '#5f6368',
      in_progress: '#1a73e8',
      done: '#137333',
      blocked: '#d93025',
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
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '28px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
    md: '0 1px 3px rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
    lg: '0 1px 3px rgba(60,64,67,0.3), 0 8px 24px 4px rgba(60,64,67,0.15)',
    glow: {
      blue: '0 0 0 1px rgba(26,115,232,0.2)',
      purple: '0 0 0 1px rgba(147,52,230,0.2)',
      green: '0 0 0 1px rgba(19,115,51,0.2)',
    },
  },
  animation: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
}

export const glassStyle = {
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: `1px solid ${tokens.colors.border.default}`,
  boxShadow: tokens.shadow.md,
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
