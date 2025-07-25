// Utilitários para gerenciamento de cookies de autenticação

export interface UserCookie {
  id: number;
  email: string;
  nome: string;
  role: string;
  modulos_permitidos: string[];
  ativo: boolean;
}

interface UserData {
  id: number;
  email: string;
  nome: string;
  role: string;
  modulos_permitidos?: string[];
  ativo?: boolean;
}

export const AUTH_COOKIE_NAME = 'sgb_user';

export function setAuthCookie(userData: UserCookie) {
  try {
    // Garantir que todos os campos obrigatórios estão presentes
    const cookieData: UserCookie = {
      id: userData.id,
      email: userData.email,
      nome: userData.nome,
      role: userData.role,
      modulos_permitidos: userData.modulos_permitidos || [],
      ativo: userData.ativo !== false,
    };

    const value = JSON.stringify(cookieData);
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 dias

    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; secure=${window.location.protocol === 'https:'}; samesite=strict`;
  } catch (error) {
    console.error('❌ Erro ao salvar cookie de autenticação:', error);
  }
}

export function getAuthCookie(): UserCookie | null {
  try {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie =>
      cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`)
    );

    if (!authCookie) return null;

    const value = authCookie.split('=')[1];
    if (!value) return null;

    const userData = JSON.parse(decodeURIComponent(value));
    return userData;
  } catch (error) {
    console.error('❌ Erro ao ler cookie de autenticação:', error);
    return null;
  }
}

export function clearAuthCookie() {
  try {
    // Limpar cookie definindo data de expiração no passado
    const pastDate = 'Thu, 01 Jan 1970 00:00:00 UTC';

    // Múltiplas tentativas de limpeza para garantir que o cookie seja removido
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=${pastDate}; path=/; domain=${window.location.hostname}`;
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=${pastDate}; path=/`;
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=${pastDate}; path=/; domain=.${window.location.hostname}`;
    document.cookie = `${AUTH_COOKIE_NAME}=; max-age=0; path=/`;
    document.cookie = `${AUTH_COOKIE_NAME}=; max-age=0; path=/; domain=${window.location.hostname}`;

    console.log('✅ Cookie de autenticação removido');
  } catch (error) {
    console.error('❌ Erro ao limpar cookie de autenticação:', error);
  }
}

// Função para sincronizar localStorage com cookie
export function syncAuthData(userData: UserData) {
  try {
    // Salvar no localStorage (dados completos)
    localStorage.setItem('sgb_user', JSON.stringify(userData));

    // Salvar no cookie (dados necessários para middleware)
    const cookieData: UserCookie = {
      id: userData.id,
      email: userData.email,
      nome: userData.nome,
      role: userData.role,
      modulos_permitidos: userData.modulos_permitidos || [],
      ativo: userData.ativo !== false,
    };

    setAuthCookie(cookieData);
  } catch (error) {
    console.error('❌ Erro ao sincronizar dados de autenticação:', error);
  }
}
