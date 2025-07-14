'use client'

import React, { useState, useEffect } from 'react'
import { Camera, User, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import FaceAuthenticator, { FaceDescriptor } from '@/components/auth/FaceAuthenticator'

interface UserData {
  id: number
  nome: string
  email: string
  bar_id: number
  role: string
}

export default function FaceAuthConfigPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [faceRegistered, setFaceRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Carregar dados do usuário
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('sgb_user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          checkFaceRegistration(parsedUser.email, parsedUser.bar_id)
        } else {
          setError('Usuário não está logado')
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        setError('Erro ao carregar dados do usuário')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  // Verificar se o usuário já tem face registrada
  const checkFaceRegistration = async (email: string, barId: number) => {
    try {
      const response = await fetch('/api/auth/face/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, barId })
      })

      const result = await response.json()
      
      if (result.success) {
        setFaceRegistered(result.faceRegistered)
      }
    } catch (error) {
      console.error('Erro ao verificar registro facial:', error)
    }
  }

  // Lidar com sucesso do registro
  const handleRegisterSuccess = (descriptor?: FaceDescriptor) => {
    setSuccess('Face registrada com sucesso! Agora você pode usar login facial.')
    setFaceRegistered(true)
    setError(null)
  }

  // Lidar com erro do registro
  const handleRegisterError = (errorMessage: string) => {
    setError(errorMessage)
    setSuccess(null)
  }

  // Remover registro facial
  const handleRemoveFace = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/face/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          barId: user.bar_id 
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Registro facial removido com sucesso!')
        setFaceRegistered(false)
        setError(null)
      } else {
        setError(result.error || 'Erro ao remover registro facial')
      }
    } catch (error: any) {
      setError('Erro ao remover registro facial: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-6"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Autenticação Facial
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure e gerencie seu login por reconhecimento facial
            </p>
          </div>

          {/* Alertas globais */}
          {error && (
            <Alert className="mb-6 border-red-200 dark:border-red-800">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 dark:border-green-800">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Atual */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <User className="w-5 h-5 icon-primary" />
                  Status da Conta
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Informações sobre seu registro facial atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuário:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {user?.nome}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {user?.email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status Facial:
                  </span>
                  <Badge className={faceRegistered ? 'badge-success' : 'badge-warning'}>
                    {faceRegistered ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Registrado
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Não Registrado
                      </>
                    )}
                  </Badge>
                </div>

                {faceRegistered && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={handleRemoveFace}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full btn-outline-dark text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Remover Registro Facial
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações de Segurança */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <Shield className="w-5 h-5 icon-primary" />
                  Segurança
                </CardTitle>
                <CardDescription className="card-description-dark">
                  Como protegemos suas informações biométricas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Criptografia Avançada
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Seus dados faciais são convertidos em códigos matemáticos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Sem Armazenamento de Imagens
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Não guardamos fotos, apenas códigos únicos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Detecção de Vida
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Protege contra fotos e vídeos falsificados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Acesso Local
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Processamento realizado no seu dispositivo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área de Registro/Atualização */}
          <Card className="card-dark mt-6">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <Camera className="w-5 h-5 icon-primary" />
                {faceRegistered ? 'Atualizar Registro Facial' : 'Registrar Face'}
              </CardTitle>
              <CardDescription className="card-description-dark">
                {faceRegistered 
                  ? 'Atualize seu registro facial se necessário'
                  : 'Configure o reconhecimento facial para login rápido e seguro'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <FaceAuthenticator
                  mode="register"
                  onSuccess={handleRegisterSuccess}
                  onError={handleRegisterError}
                  userEmail={user.email}
                  barId={user.bar_id}
                  className="border-0 shadow-none p-0 bg-transparent"
                />
              )}
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card className="card-dark mt-6">
            <CardHeader>
              <CardTitle className="card-title-dark">
                Como Usar o Login Facial
              </CardTitle>
              <CardDescription className="card-description-dark">
                Instruções para aproveitar ao máximo a autenticação facial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    ✅ Melhores Práticas
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Use boa iluminação durante o registro</li>
                    <li>• Mantenha uma expressão neutra</li>
                    <li>• Olhe diretamente para a câmera</li>
                    <li>• Evite óculos escuros ou máscaras</li>
                    <li>• Registre em ambiente silencioso</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    🚫 Evite
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Registrar em ambiente muito escuro</li>
                    <li>• Movimentar a cabeça durante captura</li>
                    <li>• Usar filtros ou efeitos na câmera</li>
                    <li>• Registro com maquiagem excessiva</li>
                    <li>• Câmera muito próxima ou distante</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 