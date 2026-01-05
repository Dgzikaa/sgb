import { supabase } from './supabase'
import { toast } from 'sonner'

// Helper para fazer requests autenticadas nas APIs do FP
export async function fetchFP(url: string, options: RequestInit = {}) {
  let token: string | null = null
  
  // SEMPRE tentar renovar a sessão do Supabase primeiro (para garantir token válido)
  try {
    console.log('🔍 DEBUG: Tentando obter sessão do Supabase Auth...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🔍 DEBUG: Resultado getSession:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionError: sessionError?.message,
      user: session?.user?.email
    })
    
    if (session?.access_token) {
      token = session.access_token
      console.log('✅ Token válido obtido do Supabase Auth')
      
      // Atualizar sgb_session com o token renovado
      localStorage.setItem('sgb_session', JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }))
    } else if (sessionError) {
      console.warn('⚠️ Erro ao obter sessão do Supabase:', sessionError.message)
    } else {
      console.warn('⚠️ Supabase Auth não retornou sessão válida')
    }
  } catch (e) {
    console.warn('⚠️ Erro ao tentar renovar sessão:', e)
  }
  
  // Se não conseguiu do Supabase, tentar pegar do sgb_session (fallback)
  if (!token) {
    console.log('🔍 DEBUG: Token não encontrado no Supabase, tentando sgb_session...')
    const sgbSession = localStorage.getItem('sgb_session')
    
    if (sgbSession) {
      try {
        const parsed = JSON.parse(sgbSession)
        console.log('🔍 DEBUG: sgb_session encontrado:', {
          hasAccessToken: !!parsed.access_token,
          hasRefreshToken: !!parsed.refresh_token,
          tokenPreview: parsed.access_token ? parsed.access_token.substring(0, 30) + '...' : 'NULL'
        })
        
        if (parsed.access_token) {
          token = parsed.access_token
          console.warn('⚠️ Usando token do sgb_session (pode estar expirado)')
        }
      } catch (e) {
        console.error('❌ Erro ao parsear sgb_session:', e)
        localStorage.removeItem('sgb_session') // Limpar se estiver corrompido
      }
    } else {
      console.log('🔍 DEBUG: sgb_session não encontrado no localStorage')
    }
  }
  
  // Se não encontrou token em nenhum lugar, redirecionar para login
  if (!token) {
    console.error('❌ Nenhum token encontrado - redirecionando para login')
    toast.error('Sessão expirada', {
      description: 'Por favor, faça login novamente.'
    })
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    
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
  
  // Verificar se a resposta foi 401 (token expirado)
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({ error: 'Não autorizado' }))
    
    // Se for erro de token expirado, tentar fazer refresh
    if (errorData.error?.includes('expired') || errorData.error?.includes('invalid JWT')) {
      console.warn('🔄 Token expirado - tentando fazer refresh...')
      
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (session?.access_token && !refreshError) {
          console.log('✅ Token renovado com sucesso!')
          
          // Atualizar localStorage
          localStorage.setItem('sgb_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }))
          
          // Tentar novamente com o novo token
          const retryHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            ...options.headers
          }
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders
          })
          
          if (!retryResponse.ok) {
            const retryError = await retryResponse.json().catch(() => ({ error: `HTTP ${retryResponse.status}` }))
            throw new Error(retryError.error || `HTTP ${retryResponse.status}`)
          }
          
          return retryResponse.json()
        } else {
          console.error('❌ Falha ao renovar token - redirecionando para login')
          
          // Limpar localStorage e redirecionar
          localStorage.removeItem('sgb_session')
          localStorage.removeItem('sgb_user')
          
          toast.error('Sessão expirada', {
            description: 'Faça login novamente para continuar.'
          })
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          
          throw new Error('Não foi possível renovar a sessão. Faça login novamente.')
        }
      } catch (refreshError: any) {
        console.error('❌ Erro ao fazer refresh do token:', refreshError)
        
        // Limpar e redirecionar
        localStorage.removeItem('sgb_session')
        localStorage.removeItem('sgb_user')
        
        toast.error('Sessão expirada', {
          description: 'Faça login novamente.'
        })
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        throw new Error('Sessão expirada. Faça login novamente.')
      }
    }
    
    throw new Error(errorData.error || 'Não autorizado')
  }
  
  // Verificar outros erros HTTP
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  
  // Retornar JSON parseado
  return response.json()
}
