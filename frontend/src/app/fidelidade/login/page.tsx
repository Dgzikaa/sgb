'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Shield
} from 'lucide-react'
import Link from 'next/link'

export default function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/fidelidade'

  // Verificar se já está logado
  useEffect(() => {
    const sessionToken = localStorage.getItem('customer_session_token')
    if (sessionToken) {
      // Já logado, redirecionar
      router.push(redirectTo)
    }
  }, [redirectTo, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/fidelidade/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Login bem-sucedido
        localStorage.setItem('customer_session_token', data.token)
        
        // Redirecionar para a URL original ou dashboard
        router.push(redirectTo)
      } else {
        setError(data.error || 'Erro ao fazer login')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-amber-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-800/10 to-yellow-800/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23D97706' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Blobs animados */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full opacity-15 blur-3xl animate-bounce"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-md mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <img 
                src="/logos/ordinario-transparente.png" 
                alt="Ordinário Bar" 
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 10px 25px rgba(255, 87, 34, 0.4))'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="text-orange-500 text-lg font-black">ORDINÁRIO</span>
                    </div>
                  `;
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Acesso ao Cartão
            </h1>
            <p className="text-amber-200">
              Entre com suas credenciais para acessar seu cartão de fidelidade
            </p>
          </div>

          {/* Login Card */}
          <Card className="bg-black/30 backdrop-blur-md border border-amber-400/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-white">
                <Shield className="w-5 h-5 mr-2 text-amber-400" />
                Login Seguro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-amber-200 mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-black/20 border-amber-400/30 text-white placeholder-amber-200/50"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <Label htmlFor="senha" className="text-amber-200 mb-2 block">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="pl-10 pr-10 bg-black/20 border-amber-400/30 text-white placeholder-amber-200/50"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert className="bg-red-500/20 border-red-400/30 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 rounded-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </div>
                  )}
                </Button>

              </form>

              {/* Links */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-amber-200/70 text-sm">
                  Ainda não tem conta?{' '}
                  <Link 
                    href="/fidelidade" 
                    className="text-amber-300 hover:text-amber-200 underline"
                  >
                    Cadastre-se aqui
                  </Link>
                </p>
                
                <Link 
                  href="/fidelidade" 
                  className="inline-flex items-center text-amber-300 hover:text-amber-200 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar à página inicial
                </Link>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}