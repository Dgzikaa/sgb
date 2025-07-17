import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Fingerprint, Smartphone, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react'

interface BiometricAuthProps {
  mode: 'register' | 'login'
  userEmail?: string
  barId?: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

export default function BiometricAuth({
  mode,
  userEmail,
  barId,
  onSuccess,
  onError,
  className = ''
}: BiometricAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState<boolean | null>(null)

  // Verificar suporte a WebAuthn
  const checkBiometricSupport = useCallback(async () => {
    if (!window.PublicKeyCredential) {
      return false
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch {
      return false
    }
  }, [])

  React.useEffect(() => {
    checkBiometricSupport().then(setIsSupported)
  }, [checkBiometricSupport])

  // Detectar tipo de dispositivo para mostrar ícone correto
  const getDeviceIcon = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return <Smartphone className="w-5 h-5" />
    }
    if (userAgent.includes('android')) {
      return <Fingerprint className="w-5 h-5" />
    }
    return <Shield className="w-5 h-5" />
  }

  const getDeviceBiometricName = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'Face ID / Touch ID'
    }
    if (userAgent.includes('android')) {
      return 'Impressão Digital / Face Unlock'
    }
    if (userAgent.includes('windows')) {
      return 'Windows Hello'
    }
    return 'Biometria do Dispositivo'
  }

  // Registrar biometria
  const registerBiometric = useCallback(async () => {
    if (!userEmail || !barId) {
      setError('Dados de usuário não fornecidos')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Gerar challenge único
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      // Configurações do WebAuthn
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "SGB - Sistema de Gestão de Bares",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userEmail),
          name: userEmail,
          displayName: userEmail,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Força biometria nativa
          userVerification: "required",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "direct",
      }

      console.log('🔐 Criando credencial biométrica...')
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Falha ao criar credencial')
      }

      console.log('✅ Credencial criada:', credential.id)

      // Salvar no banco de dados
      const attestationResponse = credential.response as AuthenticatorAttestationResponse
      const response = await fetch('/api/auth/biometric/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId: credential.id,
          publicKey: Array.from(new Uint8Array(attestationResponse.getPublicKey()!)),
          userEmail,
          barId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar credencial biométrica')
      }

      setSuccess('Biometria registrada com sucesso!')
      onSuccess?.(credential)

    } catch (error: any) {
      console.error('❌ Erro ao registrar biometria:', error)
      
      if (error.name === 'NotAllowedError') {
        setError('Acesso negado. Permita o uso da biometria nas configurações.')
      } else if (error.name === 'NotSupportedError') {
        setError('Biometria não suportada neste dispositivo.')
      } else if (error.name === 'SecurityError') {
        setError('Erro de segurança. Verifique se está em conexão HTTPS.')
      } else {
        setError('Erro ao configurar biometria. Tente novamente.')
      }
      
      onError?.(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [userEmail, barId, onSuccess, onError])

  // Login com biometria
  const loginWithBiometric = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Gerar challenge único
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      // Configurações do WebAuthn para autenticação
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [], // Deixar vazio para usar qualquer credencial disponível
        userVerification: "required",
        timeout: 60000,
      }

      console.log('🔍 Solicitando autenticação biométrica...')
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Falha na autenticação')
      }

      console.log('✅ Autenticação bem-sucedida:', credential.id)

      // Verificar no backend
      const assertionResponse = credential.response as AuthenticatorAssertionResponse
      const response = await fetch('/api/auth/biometric/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId: credential.id,
          signature: Array.from(new Uint8Array(assertionResponse.signature)),
          authenticatorData: Array.from(new Uint8Array(assertionResponse.authenticatorData)),
          clientDataJSON: Array.from(new Uint8Array(assertionResponse.clientDataJSON)),
        }),
      })

      if (!response.ok) {
        throw new Error('Falha na verificação da autenticação')
      }

      const result = await response.json()
      setSuccess('Login realizado com sucesso!')
      onSuccess?.(result)

    } catch (error: any) {
      console.error('❌ Erro no login biométrico:', error)
      
      if (error.name === 'NotAllowedError') {
        setError('Autenticação cancelada ou acesso negado.')
      } else if (error.name === 'NotSupportedError') {
        setError('Biometria não suportada neste dispositivo.')
      } else {
        setError('Erro na autenticação biométrica. Tente novamente.')
      }
      
      onError?.(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [onSuccess, onError])

  if (isSupported === null) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2">Verificando suporte biométrico...</span>
        </CardContent>
      </Card>
    )
  }

  if (!isSupported) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <Alert className="border-orange-200 dark:border-orange-800">
            <XCircle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              <strong>Biometria não disponível</strong><br />
              Este dispositivo não suporta autenticação biométrica ou não está configurada.
              <br /><br />
              <strong>Para habilitar:</strong><br />
              • iOS: Configure Face ID ou Touch ID nas Configurações<br />
              • Android: Configure impressão digital ou face unlock<br />
              • Windows: Configure Windows Hello
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          {getDeviceIcon()}
          {mode === 'register' ? 'Registrar Biometria' : 'Login Biométrico'}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
          {mode === 'register' 
            ? `Configure ${getDeviceBiometricName()} para logins rápidos e seguros`
            : `Use ${getDeviceBiometricName()} para fazer login`
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alertas */}
        {error && (
          <Alert className="border-red-200 dark:border-red-800">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Área principal */}
        <div className="text-center py-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            {getDeviceIcon()}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {mode === 'register' 
              ? 'Toque no botão abaixo para configurar sua biometria'
              : 'Toque no botão abaixo para fazer login'
            }
          </p>
        </div>

        {/* Botão principal */}
        <Button
          onClick={mode === 'register' ? registerBiometric : loginWithBiometric}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-3 text-base"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            getDeviceIcon()
          )}
          {isLoading 
            ? (mode === 'register' ? 'Configurando...' : 'Autenticando...')
            : (mode === 'register' ? `Configurar ${getDeviceBiometricName()}` : `Entrar com ${getDeviceBiometricName()}`)
          }
        </Button>

        {/* Informações */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-4">
          <p className="font-medium">✅ Vantagens da biometria nativa:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Instantâneo e seguro</li>
            <li>Usa hardware dedicado do dispositivo</li>
            <li>Funciona offline</li>
            <li>Não precisa de câmera ligada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 
