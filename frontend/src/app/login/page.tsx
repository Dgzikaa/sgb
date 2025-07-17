'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, Eye, EyeOff, Fingerprint } from 'lucide-react'
import BiometricAuth from '@/components/auth/BiometricAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [logoError, setLogoError] = useState(false)
  
  // Estado para controlar o má©todo de login
  const [loginMethod, setLoginMethod] = useState<'traditional' | 'biometric'>('traditional')
  const [showBiometricRegistration, setShowBiometricRegistration] = useState(false)
  const [lastLoginData, setLastLoginData] = useState<any>(null)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Capturar URL de retorno se houver (sá³ no cliente)
  const returnUrl = isHydrated ? searchParams.get('returnUrl') : null

  // Controlar hidrataá§á£o - sá³ executa apá³s componente montar
  useEffect(() => {
    setIsHydrated(true)
    
    // Detectar dispositivo má³vel
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobile = mobileRegex.test(userAgent)
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent)
      setIsMobileDevice(isMobile || isTablet)
    }
    
    checkMobileDevice()
  }, [])

  // Verificar se usuá¡rio já¡ está¡ logado
  useEffect(() => {
    const checkAuthStatus = () => {
      // Verificar se estamos no cliente antes de acessar localStorage
      if (typeof window === 'undefined') return
      
      try {
        const userData = localStorage.getItem('sgb_user')
        if (userData) {
          // Validar se os dados sá£o vá¡lidos (ná£o apenas se existem)
          const user = JSON.parse(userData)
          if (user && user.email && user.nome) {
            console.log('œ… Usuá¡rio já¡ logado, redirecionando...', user.nome)
            const destination = returnUrl ? decodeURIComponent(returnUrl) : '/home'
            setSuccess(`Usuá¡rio já¡ logado! Redirecionando para ${destination}...`)
            setTimeout(() => {
              router.push(destination)
            }, 1000)
          } else {
            // Dados invá¡lidos, limpar localStorage
            console.log('š ï¸ Dados de usuá¡rio invá¡lidos, limpando...')
            localStorage.removeItem('sgb_user')
          }
        }
      } catch (error) {
        console.log('ðŸ” Verificaá§á£o de auth falhou, limpando dados:', error)
        // Se houver erro ao parsear, limpar dados corrompidos
        localStorage.removeItem('sgb_user')
      }
    }

    checkAuthStatus()
  }, [router, returnUrl])

  // Auto-fechar modal de recuperaá§á£o apá³s sucesso
  useEffect(() => {
    if (forgotSuccess) {
      const timer = setTimeout(() => {
        setShowForgotPassword(false)
        setForgotEmail('')
        setForgotSuccess(false)
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [forgotSuccess])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setError(null)
    
    try {
      // Simulaá§á£o de envio de email de recuperaá§á£o
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Solicitation para recuperaá§á£o de senha:', forgotEmail)
      setForgotSuccess(true)
      
    } catch (error: any) {
      setError('Erro ao enviar email de recuperaá§á£o: ' + error.message)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Chamar edge function de login local
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          senha: password,
        })
      })

      const result = await response.json()

      if (!result.success) {
        // Verificar se á© redirecionamento para redefiniá§á£o de senha
        if (result.requirePasswordReset && result.redirectUrl) {
          setSuccess(`Olá¡ ${result.user?.nome}! Redirecionando para redefiniá§á£o de senha...`)
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              router.push(result.redirectUrl)
            }
          }, 2000)
          return
        }
        
        setError(result.error || 'Erro no login')
        return
      }

      // Salvar dados do usuá¡rio no localStorage e cookie
      const { syncAuthData } = await import('@/lib/cookies')
      syncAuthData(result.user)
      
      // Verificar se o usuá¡rio tem biometria registrada
      try {
        const biometricStatusResponse = await fetch('/api/auth/biometric/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: result.user.email,
            barId: result.user.bar_id
          })
        })
        
        const biometricStatus = await biometricStatusResponse.json()
        
        if (biometricStatus.success && !biometricStatus.biometricRegistered) {
          // Usuá¡rio ná£o tem biometria registrada - oferecer registro
          setLastLoginData(result.user)
          setShowBiometricRegistration(true)
          setSuccess(`œ… Login realizado! Quer configurar biometria para prá³ximos logins?`)
          return
        }
      } catch (error) {
        console.warn('Erro ao verificar status biomá©trico:', error)
      }
      
      // Redirecionar normalmente
      const destination = returnUrl ? decodeURIComponent(returnUrl) : '/home'
      setSuccess(`œ… Login realizado com sucesso! Redirecionando...`)
      setTimeout(() => {
        router.push(destination)
      }, 1500)
      
    } catch (error: any) {
      setError('Erro na conexá£o: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Funá§á£o para lidar com sucesso do login biomá©trico
  const handleBiometricLoginSuccess = async (userData?: any) => {
    if (userData) {
      // Salvar dados do usuá¡rio no localStorage e cookie
      const { syncAuthData } = await import('@/lib/cookies')
      syncAuthData(userData)
      
      const destination = returnUrl ? decodeURIComponent(returnUrl) : '/home'
      setSuccess(`ðŸŽ‰ Login biomá©trico realizado com sucesso! Bem-vindo(a), ${userData.nome}! Redirecionando...`)
      setTimeout(() => {
        router.push(destination)
      }, 2000)
    }
  }

  // Funá§á£o para lidar com erro do login biomá©trico
  const handleBiometricLoginError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Funá§á£o para lidar com sucesso do registro biomá©trico apá³s login
  const handlePostLoginBiometricRegister = async (userData?: any) => {
    if (lastLoginData) {
      setShowBiometricRegistration(false)
      setSuccess(`ðŸŽ‰ Biometria configurada! Agora vocáª pode fazer login rapidamente!`)
      
      const destination = returnUrl ? decodeURIComponent(returnUrl) : '/home'
      setTimeout(() => {
        router.push(destination)
      }, 2000)
    }
  }

  // Funá§á£o para pular registro biomá©trico
  const skipBiometricRegistration = () => {
    setShowBiometricRegistration(false)
    const destination = returnUrl ? decodeURIComponent(returnUrl) : '/home'
    setSuccess(`œ… Login concluá­do! Redirecionando...`)
    setTimeout(() => {
      router.push(destination)
    }, 1000)
  }

  // Ná£o renderizar nada atá© hidrataá§á£o completa para evitar mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center py-8">
              <div className="animate-pulse">Carregando...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4" suppressHydrationWarning>
      <div className="w-full max-w-md" suppressHydrationWarning>
        {/* Logo e Header */}
        <div className="text-center mb-8" suppressHydrationWarning>
          <div className="inline-flex items-center justify-center w-52 h-52 lg:w-72 lg:h-72 mb-4" suppressHydrationWarning>
            {!logoError ? (
              <img 
                src="/logos/logo_640x640.png" 
                alt="SGB Logo" 
                className="w-52 h-52 lg:w-72 lg:h-72 object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-52 h-52 lg:w-72 lg:h-72 bg-indigo-600 flex items-center justify-center" suppressHydrationWarning>
                <span className="text-8xl lg:text-9xl text-white">ðŸª</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuraá§á£o de biometria pá³s-login */}
        {showBiometricRegistration && lastLoginData && (
          <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg" suppressHydrationWarning>
            <div className="text-center mb-4" suppressHydrationWarning>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3" suppressHydrationWarning>
                <Fingerprint className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Configurar Biometria
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Quer configurar biometria para prá³ximos logins?
              </p>
            </div>
            
            <BiometricAuth
              mode="register"
              onSuccess={handlePostLoginBiometricRegister}
              onError={handleBiometricLoginError}
              userEmail={lastLoginData.email}
              barId={lastLoginData.bar_id}
              className="mb-4"
            />
            
            <div className="flex gap-2">
              <button
                onClick={skipBiometricRegistration}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Agora Ná£o
              </button>
            </div>
          </div>
        )}

        {/* Notificaá§áµes */}
        {returnUrl && !showBiometricRegistration && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4" suppressHydrationWarning>
            <div className="flex items-center space-x-3" suppressHydrationWarning>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center" suppressHydrationWarning>
                <span className="text-blue-600 dark:text-blue-400 text-sm">ðŸ”’</span>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">Acesso protegido</p>
                <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">Faá§a login para acessar a pá¡gina solicitada</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4" suppressHydrationWarning>
            <div className="flex items-center space-x-3" suppressHydrationWarning>
              <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center" suppressHydrationWarning>
                <span className="text-red-600 dark:text-red-400 text-sm">!</span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4" suppressHydrationWarning>
            <div className="flex items-center space-x-3" suppressHydrationWarning>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center" suppressHydrationWarning>
                <span className="text-green-600 dark:text-green-400 text-sm animate-pulse">œ“</span>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Seletor de Má©todo de Login */}
        {!showBiometricRegistration && (
          <div className="mb-6">
            {isMobileDevice ? (
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button
                  onClick={() => setLoginMethod('traditional')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    loginMethod === 'traditional'
                      ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Email & Senha
                </button>
                <button
                  onClick={() => setLoginMethod('biometric')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    loginMethod === 'biometric'
                      ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  Biomá©trico
                </button>
              </div>
            ) : (
              <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm">
                  <LogIn className="w-4 h-4" />
                  Email & Senha
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conteáºdo baseado no má©todo escolhido */}
        {!showBiometricRegistration && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          {loginMethod === 'traditional' ? (
            /* Formulá¡rio de Login Tradicional */
            <>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="elegant-form-group">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="elegant-input w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                    Senha
                  </label>
                  <div className="relative elegant-form-group">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="elegant-input w-full pr-12 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      placeholder="€¢€¢€¢€¢€¢€¢€¢€¢"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Entrar no sistema</span>
                    </>
                  )}
                </button>
              </form>

              {/* Links adicionais */}
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            </>
          ) : (
            /* Login Biomá©trico */
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4">
                  <Fingerprint className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Login Biomá©trico
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  Use seu rosto para fazer login de forma rá¡pida e segura
                </p>
              </div>

              <BiometricAuth
                mode="login"
                onSuccess={handleBiometricLoginSuccess}
                onError={handleBiometricLoginError}
                barId="1" // Vocáª pode pegar isso de algum contexto ou seleá§á£o
                className="border-0 shadow-none p-0 bg-transparent"
              />

              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Problemas com a biometria?
                </p>
                <button
                  onClick={() => setLoginMethod('traditional')}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Use login tradicional
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400 dark:text-gray-500 text-sm">
          <p>© 2025 Sistema de Gestá£o de Bares - Todos os direitos reservados</p>
        </div>
      </div>

      {/* Modal Esqueci Minha Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" suppressHydrationWarning>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl" suppressHydrationWarning>
            <div className="text-center mb-6" suppressHydrationWarning>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4" suppressHydrationWarning>
                <span className="text-2xl">ðŸ”‘</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Recuperar Senha
              </h2>
              <p className="text-slate-600 dark:text-gray-400">
                Digite seu e-mail para receber as instruá§áµes de recuperaá§á£o
              </p>
            </div>

            {forgotSuccess ? (
              <div className="text-center" suppressHydrationWarning>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full mb-4" suppressHydrationWarning>
                  <span className="text-2xl text-green-600 dark:text-green-400">œ“</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  E-mail Enviado!
                </h3>
                <p className="text-slate-600 dark:text-gray-400 mb-4">
                  Verifique sua caixa de entrada e siga as instruá§áµes para redefinir sua senha.
                </p>
                <div className="text-sm text-slate-500 dark:text-gray-500">
                  Este modal será¡ fechado automaticamente...
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="elegant-input w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotEmail('')
                      setError(null)
                    }}
                    className="flex-1 bg-slate-200 dark:bg-gray-600 hover:bg-slate-300 dark:hover:bg-gray-500 text-slate-700 dark:text-gray-200 font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      'Enviar'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 
