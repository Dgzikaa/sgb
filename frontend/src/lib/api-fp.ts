import { supabase } from './supabase'

// Helper para fazer requests autenticadas nas APIs do FP
export async function fetchFP(url: string, options: RequestInit = {}) {
  let token: string | null = null
  
  // 1. Tentar pegar do sgb_session (salvo no login)
  const sgbSession = localStorage.getItem('sgb_session')
  
  if (sgbSession) {
    try {
      const parsed = JSON.parse(sgbSession)
      if (parsed.access_token) {
        token = parsed.access_token
        console.log('✅ Token encontrado em sgb_session')
      }
    } catch (e) {
      console.error('Erro ao parsear sgb_session:', e)
    }
  }
  
  // 2. Se não encontrou, tentar pegar do Supabase client
  if (!token) {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      token = session.access_token
      console.log('✅ Token encontrado no Supabase')
    }
  }
  
  // 3. Se não encontrou, tentar pegar do localStorage padrão do Supabase
  if (!token) {
    const storageKey = 'sb-uqtgsvujwcbymjmvkjhy-auth-token'
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.access_token) {
          token = parsed.access_token
          console.log('✅ Token encontrado no localStorage padrão')
        }
      } catch (e) {
        console.error('Erro ao parsear token:', e)
      }
    }
  }
  
  // Se não encontrou token em nenhum lugar, lançar erro
  if (!token) {
    throw new Error('Usuário não autenticado. Faça login novamente.')
  }
  
  // Fazer requisição com o token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  // Verificar se a resposta foi bem-sucedida
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  
  // Retornar JSON parseado
  return response.json()
}
