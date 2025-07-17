// Utilit·°rios para gerenciamento de cookies de autentica·ß·£o

export interface UserCookie {
  id: number
  email: string
  nome: string
  role: string
  modulos_permitidos: string[]
  ativo: boolean
}

export const AUTH_COOKIE_NAME = 'sgb_user'

export function setAuthCookie(userData: UserCookie) {
  try {
    // Garantir que todos os campos obrigat·≥rios est·£o presentes
    const cookieData: UserCookie = {
      id: userData.id,
      email: userData.email,
      nome: userData.nome,
      role: userData.role,
      modulos_permitidos: userData.modulos_permitidos || [],
      ativo: userData.ativo !== false
    }
    
    const value = JSON.stringify(cookieData)
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // 7 dias

    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; secure=${window.location.protocol === 'https:'}; samesite=strict`
  } catch (error) {
    console.error('ùå Erro ao salvar cookie de autentica·ß·£o:', error)
  }
}

export function getAuthCookie(): UserCookie | null {
  try {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find((cookie) => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`))
    
    if (!authCookie) return null
    
    const value = authCookie.split('=')[1]
    if (!value) return null
    
    const userData = JSON.parse(decodeURIComponent(value))
    return userData
  } catch (error) {
    console.error('ùå Erro ao ler cookie de autentica·ß·£o:', error)
    return null
  }
}

export function clearAuthCookie() {
  try {
    // Limpar cookie definindo data de expira·ß·£o no passado
    const pastDate = 'Thu, 01 Jan 1970 00:00:00 UTC'
    
    // M·∫ltiplas tentativas de limpeza para garantir que o cookie seja removido
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=${pastDate}; path=/; domain=${window.location.hostname}`
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=${pastDate}; path=/`
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=${pastDate}; path=/; domain=.${window.location.hostname}`
    document.cookie = `${AUTH_COOKIE_NAME}=; max-age=0; path=/`
    document.cookie = `${AUTH_COOKIE_NAME}=; max-age=0; path=/; domain=${window.location.hostname}`
    
    console.log('úÖ Cookie de autentica·ß·£o removido')
  } catch (error) {
    console.error('ùå Erro ao limpar cookie de autentica·ß·£o:', error)
  }
}

// Fun·ß·£o para sincronizar localStorage com cookie
export function syncAuthData(userData) {
  try {
    // Salvar no localStorage (dados completos)
    localStorage.setItem('sgb_user', JSON.stringify(userData))
    
    // Salvar no cookie (dados necess·°rios para middleware)
    const cookieData: UserCookie = {
      id: userData.id,
      email: userData.email,
      nome: userData.nome,
      role: userData.role,
      modulos_permitidos: userData.modulos_permitidos || [],
      ativo: userData.ativo !== false
    }
    
    setAuthCookie(cookieData)
  } catch (error) {
    console.error('ùå Erro ao sincronizar dados de autentica·ß·£o:', error)
  }
} 
