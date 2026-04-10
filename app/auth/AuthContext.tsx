import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

const STORAGE_KEY = 'lumina_google_user_v1'

export type GoogleUser = {
  sub: string
  email?: string
  name?: string
  picture?: string
}

function decodeCredentialJwt(credential: string): Partial<GoogleUser> {
  try {
    const part = credential.split('.')[1]
    if (!part) return {}
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const p = JSON.parse(json) as Record<string, unknown>
    return {
      sub: typeof p.sub === 'string' ? p.sub : '',
      email: typeof p.email === 'string' ? p.email : undefined,
      name: typeof p.name === 'string' ? p.name : undefined,
      picture: typeof p.picture === 'string' ? p.picture : undefined,
    }
  } catch {
    return {}
  }
}

type AuthContextValue = {
  user: GoogleUser | null
  setUserFromCredential: (credential: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<GoogleUser | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const p = JSON.parse(raw) as GoogleUser
      if (p?.sub) setUser(p)
    } catch {
      /* ignore */
    }
  }, [])

  const setUserFromCredential = useCallback((credential: string) => {
    const decoded = decodeCredentialJwt(credential)
    if (!decoded.sub) return
    const next: GoogleUser = {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
    setUser(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({ user, setUserFromCredential, logout }),
    [user, setUserFromCredential, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
