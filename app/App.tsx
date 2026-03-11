import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppProvider, useAppState } from './store/AppContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DashboardStrip } from './components/DashboardStrip'
import { MonthView, WeekView, DayView, AgendaView } from './components/CalendarViews'
import { WBSPanel } from './components/WBSPanel'
import { EventDetailPanel } from './components/EventDetail'
import { AIChat } from './components/AIChat'
import { tokens } from './utils/design'

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background: ${tokens.colors.bg.primary}; 
    color: ${tokens.colors.text.primary};
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow: hidden;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  input::placeholder { color: ${tokens.colors.text.tertiary}; }
  button { font-family: inherit; }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
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

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {(state.activePanel === 'calendar' || state.activePanel === 'both') && (
          <CalendarPanel />
        )}

        {state.activePanel === 'both' && (
          <div style={{
            width: 1,
            background: tokens.colors.border.subtle,
            flexShrink: 0,
          }} />
        )}

        {(state.activePanel === 'wbs' || state.activePanel === 'both') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              width: state.activePanel === 'both' ? 440 : '100%',
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <WBSPanel />
          </motion.div>
        )}

        {/* Event Detail Sidebar */}
        <EventDetailPanel />
      </div>
    </div>
  )
}

const AppInner: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: tokens.colors.bg.primary,
      overflow: 'hidden',
    }}>
      <Sidebar />
      <MainContent />
      <AIChat />
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <AppProvider>
        <AppInner />
      </AppProvider>
    </>
  )
}
