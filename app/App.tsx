import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppProvider, useAppState } from './store/AppContext'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DashboardStrip } from './components/DashboardStrip'
import { MonthView, WeekView, DayView, AgendaView } from './components/CalendarViews'
import { WBSPanel } from './components/WBSPanel'
import { EventDetailPanel } from './components/EventDetail'
import { AIChat } from './components/AIChat'
import { CreateModal } from './components/CreateModal'
import { SearchOverlay } from './components/SearchOverlay'
import { NotificationsPanel } from './components/NotificationsPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { TeamPanel } from './components/TeamPanel'
import { LoginPage } from './components/LoginPage'
import { BottomNav } from './components/BottomNav'
import { isSupabaseConfigured } from './lib/supabase'
import { useBreakpoint } from './hooks/useBreakpoint'
import { tokens } from './utils/design'

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background: ${tokens.colors.bg.primary}; 
    color: ${tokens.colors.text.primary};
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow: hidden;
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: ${tokens.colors.bg.tertiary}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
  input::placeholder { color: ${tokens.colors.text.tertiary}; }
  button { font-family: inherit; }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  /* Mobile: CreateModal as bottom sheet */
  @media (max-width: 767px) {
    .create-modal-backdrop {
      align-items: flex-end !important;
    }
    .create-modal-card {
      border-radius: 20px 20px 0 0 !important;
      max-height: 92dvh !important;
    }
  }
`

const CalendarPanel: React.FC = () => {
  const { state } = useAppState()
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <DashboardStrip />
      <AnimatePresence mode="wait">
        <motion.div
          key={state.viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
        >
          {state.viewMode === 'month' && <MonthView />}
          {state.viewMode === 'week' && <WeekView />}
          {state.viewMode === 'day' && <DayView />}
          {state.viewMode === 'agenda' && <AgendaView />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const MainContent: React.FC = () => {
  const { state } = useAppState()
  const isMobile = useBreakpoint(768)

  // On mobile, never split. Also don't show "both" panel – just calendar.
  const effectivePanel = isMobile && state.activePanel === 'both' ? 'calendar' : state.activePanel

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
      paddingBottom: isMobile ? 'calc(56px + env(safe-area-inset-bottom))' : 0,
    }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {effectivePanel === 'analytics' && <AnalyticsPanel />}
        {effectivePanel === 'team' && <TeamPanel />}

        {(effectivePanel === 'calendar' || effectivePanel === 'both') && <CalendarPanel />}

        {effectivePanel === 'both' && !isMobile && (
          <div style={{ width: 1, background: tokens.colors.border.subtle, flexShrink: 0 }} />
        )}

        {(effectivePanel === 'wbs' || effectivePanel === 'both') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              width: effectivePanel === 'both' && !isMobile ? 440 : '100%',
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <WBSPanel />
          </motion.div>
        )}

        <EventDetailPanel />
      </div>
    </div>
  )
}

const AppInner: React.FC = () => {
  const isMobile = useBreakpoint(768)
  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', background: tokens.colors.bg.primary, overflow: 'hidden' }}>
      <Sidebar />
      <MainContent />
      {isMobile && <BottomNav />}
      <AIChat />
      <CreateModal />
      <SearchOverlay />
      <NotificationsPanel />
      <SettingsPanel />
    </div>
  )
}

const SupabaseConfigMissing: React.FC = () => (
  <div
    style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: tokens.colors.bg.primary,
      color: tokens.colors.text.primary,
    }}
  >
    <div
      style={{
        maxWidth: 520,
        padding: 28,
        borderRadius: 16,
        background: tokens.colors.bg.secondary,
        border: `1px solid ${tokens.colors.border.subtle}`,
        boxShadow: tokens.shadow.lg,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Supabase の設定が必要です</h1>
      <p style={{ fontSize: 14, color: tokens.colors.text.secondary, lineHeight: 1.6, marginBottom: 16 }}>
        環境変数が空のままだと Supabase の SDK が起動時にエラーを投げ、画面が真っ白になります。ローカルではプロジェクトルートに{' '}
        <code style={{ fontSize: 13, background: tokens.colors.bg.tertiary, padding: '2px 6px', borderRadius: 4 }}>.env</code>
        {' '}（git に含めない）を置き、次を設定してください。Vercel 等ではダッシュボードの Environment Variables に同じ名前で登録します。
        <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: tokens.colors.text.tertiary }}>
          ※ <code style={{ fontSize: 11 }}>.env</code> ファイル自体はビルド成果物に含まれません。参照している{' '}
          <code style={{ fontSize: 11 }}>VITE_*</code> の値だけがビルド時に JS へ差し替えられます（Supabase anon は公開前提）。
        </span>
      </p>
      <pre
        style={{
          fontSize: 12,
          padding: 14,
          borderRadius: 10,
          background: tokens.colors.bg.tertiary,
          border: `1px solid ${tokens.colors.border.subtle}`,
          overflow: 'auto',
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        {`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJ...`}
      </pre>
      <p style={{ fontSize: 13, color: tokens.colors.text.secondary, lineHeight: 1.55 }}>
        データベースは SQL Editor で <code style={{ fontSize: 12, background: tokens.colors.bg.tertiary, padding: '2px 6px', borderRadius: 4 }}>supabase/migration.sql</code>{' '}
        を実行してテーブルを作成し、Authentication で Google プロバイダーを有効化してください。設定後にページを再読み込みします。
      </p>
    </div>
  </div>
)

const AuthGate: React.FC = () => {
  const { user, loading } = useAuth()

  if (!isSupabaseConfigured) {
    return <SupabaseConfigMissing />
  }

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tokens.colors.bg.primary }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 32, height: 32, border: `3px solid ${tokens.colors.border.default}`, borderTopColor: tokens.colors.accent.blue, borderRadius: '50%' }}
        />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}

export const App: React.FC = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </>
  )
}
