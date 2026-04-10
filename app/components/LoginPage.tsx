import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Zap } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { tokens } from '../utils/design'
import { getSupabaseAuthCallbackUrl } from '../utils/supabaseOAuthHint'

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth()
  const googleRedirectUri = getSupabaseAuthCallbackUrl()

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${tokens.colors.bg.primary} 0%, #e8eaf6 100%)`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: tokens.colors.bg.secondary,
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          border: `1px solid ${tokens.colors.border.subtle}`,
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
          }}
        >
          <Calendar size={30} color="#fff" />
        </motion.div>

        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: tokens.colors.text.primary,
              letterSpacing: '-0.5px',
              marginBottom: 8,
            }}
          >
            OS Calendar App
          </h1>
          <p
            style={{
              fontSize: 14,
              color: tokens.colors.text.secondary,
              lineHeight: 1.6,
            }}
          >
            カレンダー・WBS・AI アシスタントを
            <br />
            ひとつにまとめたスケジュール管理
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: 14,
            border: `1px solid ${tokens.colors.border.default}`,
            background: tokens.colors.bg.card,
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 15,
            fontWeight: 600,
            color: tokens.colors.text.primary,
            boxShadow: tokens.shadow.sm,
            transition: 'box-shadow 0.2s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.02 24.02 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Google でログイン
        </motion.button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: tokens.colors.text.tertiary,
          }}
        >
          <Zap size={12} />
          Gemini AI 対応
        </div>

        {googleRedirectUri && (
          <details
            style={{
              width: '100%',
              marginTop: 4,
              fontSize: 11,
              color: tokens.colors.text.tertiary,
              lineHeight: 1.5,
            }}
          >
            <summary style={{ cursor: 'pointer', color: tokens.colors.text.secondary, fontWeight: 600 }}>
              エラー 400: redirect_uri_mismatch のとき
            </summary>
            <p style={{ marginTop: 10, marginBottom: 8 }}>
              Google Cloud Console → 対象の OAuth 2.0 クライアント →
              <strong> 承認済みのリダイレクト URI</strong> に、次を<strong>そのまま</strong>追加してください（アプリの URL ではありません）。
            </p>
            <code
              style={{
                display: 'block',
                wordBreak: 'break-all',
                padding: '10px 12px',
                borderRadius: 8,
                background: tokens.colors.bg.tertiary,
                border: `1px solid ${tokens.colors.border.subtle}`,
                fontSize: 11,
                color: tokens.colors.text.primary,
              }}
            >
              {googleRedirectUri}
            </code>
            <p style={{ marginTop: 10 }}>
              <strong>承認済みの JavaScript 生成元</strong>には{' '}
              <code style={{ fontSize: 10, background: tokens.colors.bg.tertiary, padding: '1px 4px', borderRadius: 4 }}>http://localhost:3000</code>
              {' '}や本番のオリジン（例: Vercel の URL）を入れます。Supabase ダッシュボードの Authentication → URL
              Configuration では、Site URL と Redirect URLs にアプリの URL を登録してください。
            </p>
          </details>
        )}
      </motion.div>
    </div>
  )
}
