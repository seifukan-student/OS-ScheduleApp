import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export type AppUser = {
  id: string
  email?: string
  name?: string
  picture?: string
}

function toAppUser(u: User): AppUser {
  const meta = u.user_metadata ?? {}
  return {
    id: u.id,
    email: u.email ?? (meta.email as string | undefined),
    name: (meta.full_name ?? meta.name ?? meta.display_name) as string | undefined,
    picture: (meta.avatar_url ?? meta.picture) as string | undefined,
  }
}

type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null)
      setLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ? toAppUser(session.user) : null)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ? toAppUser(session.user) : null)
        setLoading(false)
      },
    )
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }, [])

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, logout }),
    [user, loading, signInWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
