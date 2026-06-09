import { useState, useEffect } from 'react'

export function usePatreonAuth(onTokenReady?: (token: string) => void) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.patreonAPI.getSavedTokens().then(tokens => {
      if (tokens) {
        setAccessToken(tokens.access_token)
        onTokenReady?.(tokens.access_token)
      }
      setLoading(false)
    })
  }, [])

  const login = (onSuccess: (token: string) => void) => {
    window.patreonAPI.onAuthSuccess(tokens => {
      setAccessToken(tokens.access_token)
      setError(null)
      onSuccess(tokens.access_token)
    })
    window.patreonAPI.onAuthError(message => setError(message))
    window.patreonAPI.login()
  }

  const logout = async () => {
    await window.patreonAPI.logout()
    setAccessToken(null)
    setError(null)
  }

  return { accessToken, error, loading, login, logout }
}