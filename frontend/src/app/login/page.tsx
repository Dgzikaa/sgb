'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, Eye, EyeOff } from 'lucide-react'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Capturar URL de retorno se houver
  const returnUrl = searchParams.get('returnUrl')

  // Verificar se usuário já está logado
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const userData = localStorage.getItem('sgb_user')
        if (userData) {
          // Validar se os dados são válidos (não apenas se existem)
          const user = JSON.parse(userData)
          if (user && user.email && user.nome) {
            console.log('✅ Usuário já logado, redirecionando...', user.nome)
            const destination = returnUrl ? decodeURIComponent(returnUrl) : '/home'
            setSuccess(`Usuário já logado! Redirecionando para ${destination}...`)
            setTimeout(() => {
              router.push(destination)
            }, 1000)
          } else {
            // Dados inválidos, limpar localStorage
            console.log('⚠️ Dados de usuário inválidos, limpando...')
            localStorage.removeItem('sgb_user')
          }
        }
      } catch (error) {
        console.log('🔍 Verificação de auth falhou, limpando dados:', error)
        // Se houver erro ao parsear, limpar dados corrompidos
        localStorage.removeItem('sgb_user')
      }
    }
    
    // Delay para garantir que o logout foi processado completamente
    const timeoutId = setTimeout(checkAuthStatus, 100)
    return () => clearTimeout(timeoutId)
  }, [router])

  // Auto-hide notificações após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail })
      })

      const result = await response.json()

      if (result.success) {
        setForgotSuccess(true)
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotSuccess(false)
          setForgotEmail('')
        }, 3000)
      } else {
        setError(result.error || 'Erro ao enviar e-mail de recuperação')
      }
    } catch (error: any) {
      setError('Erro na conexão: ' + error.message)
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
        // Verificar se é redirecionamento para redefinição de senha
        if (result.requirePasswordReset && result.redirectUrl) {
          setSuccess(`Olá ${result.user?.nome}! Redirecionando para redefinição de senha...`)
          setTimeout(() => {
            window.location.href = result.redirectUrl
          }, 2000)
          return
        }
        
        setError(result.error || 'Erro no login')
        return
      }

      // Salvar dados do usuário no localStorage e cookie
      const { syncAuthData } = await import('@/lib/cookies')
      syncAuthData(result.user)
      
      // Determinar para onde redirecionar
      const destination = returnUrl ? decodeURIComponent(returnUrl) : '/home'
      
      setSuccess(`Login realizado com sucesso! Redirecionando para ${destination.startsWith('/home') ? 'início' : 'página solicitada'}...`)
      setTimeout(() => {
        router.push(destination)
      }, 1500)
      
    } catch (error: any) {
      setError('Erro na conexão: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl mb-6 shadow-lg">
            <span className="text-3xl text-white">🏪</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">SGB</h1>
          <p className="text-slate-600 text-lg font-medium">Sistema de Gestão de Bares</p>
          <p className="text-sm text-slate-400 mt-2">Grupo Menos é Mais</p>
        </div>

        {/* Notificações */}
        {returnUrl && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🔒</span>
              </div>
              <div>
                <p className="text-blue-700 text-sm font-medium">Acesso protegido</p>
                <p className="text-blue-600 text-xs mt-1">Faça login para acessar a página solicitada</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">!</span>
              </div>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm animate-pulse">✓</span>
              </div>
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-3">
                Email
              </label>
              <div className="elegant-form-group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="elegant-input w-full"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-3">
                Senha
              </label>
              <div className="relative elegant-form-group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="elegant-input w-full pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
            >
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400 text-sm">
          <p>© 2025 Sistema de Gestão de Bares - Todos os direitos reservados</p>
        </div>
      </div>

      {/* Modal Esqueci Minha Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl">🔑</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Recuperar Senha
              </h2>
              <p className="text-slate-600">
                Digite seu e-mail para receber as instruções de recuperação
              </p>
            </div>

            {forgotSuccess ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  E-mail Enviado!
                </h3>
                <p className="text-slate-600 mb-4">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <div className="text-sm text-slate-500">
                  Este modal será fechado automaticamente...
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="elegant-input w-full"
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
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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