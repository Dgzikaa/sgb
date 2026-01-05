import { supabase } from './supabase'

// Helper para fazer requests autenticadas nas APIs do FP
export async function fetchFP(url: string, options: RequestInit = {}) {
  // 1. Tentar pegar do sgb_session (salvo no login)
  const sgbSession = localStorage.getItem('sgb_session')
  
  if (sgbSession) {
    try {
      const parsed = JSON.parse(sgbSession)
      if (parsed.access_token) {
        console.log('✅ Token encontrado em sgb_session')
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parsed.access_token}`,
          ...options.headers
        }
        
        const response = await fetch(url, {
          ...options,
          headers
        })
        
        return response
      }
    } catch (e) {
      console.error('Erro ao parsear sgb_session:', e)
    }
  }
  
  // 2. Tentar pegar do Supabase client
  const { data: { session }, error } = await supabase.auth.getSession()
  
  console.log('🔍 DEBUG fetchFP:', {
    hasSgbSession: !!sgbSession,
    hasSupabaseSession: !!session,
    hasToken: !!session?.access_token,
    error: error?.message
  })
  
  if (session?.access_token) {
    console.log('✅ Token encontrado no Supabase')
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })
    
    return response
  }
  
  // 3. Tentar pegar do localStorage padrão do Supabase
  const storageKey = 'sb-uqtgsvujwcbymjmvkjhy-auth-token'
  const stored = localStorage.getItem(storageKey)
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.access_token) {
        console.log('✅ Token encontrado no localStorage padrão')
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parsed.access_token}`,
          ...options.headers
        }
        
        const response = await fetch(url, {
          ...options,
          headers
        })
        
        return response
      }
    } catch (e) {
      console.error('Erro ao parsear token:', e)
    }
  }
  
  throw new Error('Usuário não autenticado. Faça login novamente.')
}
