'use client'

import { useState, useRef, useEffect } from 'react'
import { useStaffAuth } from '@/hooks/useStaffAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import QRCameraScanner from '@/components/QRCameraScanner'
import { 
  QrCode, 
  Camera, 
  User, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Scan,
  RefreshCw
} from 'lucide-react'

interface MembroData {
  id: string
  nome: string
  email: string
  plano: string
  status: string
  bar_id: number
  data_adesao: string
}

interface ConsultaResult {
  success: boolean
  membro?: MembroData
  saldo_atual?: number
  pode_usar?: boolean
  error?: string
  timestamp?: string
}

interface DescontoResult {
  success: boolean
  membro_id?: string
  membro_nome?: string
  transacao_id?: string
  valor_desconto?: number
  saldo_anterior?: number
  saldo_atual?: number
  error?: string
  timestamp?: string
}

export default function QRScannerPage() {
  // Verificar autenticação obrigatória
  const { staff, loading: authLoading, isAuthenticated } = useStaffAuth(true)
  // Estados principais
  const [qrToken, setQrToken] = useState('')
  const [valorDesconto, setValorDesconto] = useState('')
  const [membroData, setMembroData] = useState<ConsultaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<DescontoResult | null>(null)

  // Estados de feedback
  const [showCamera, setShowCamera] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Função para consultar QR Code
  const consultarQR = async (token: string) => {
    setLoading(true)
    setError('')
    setMembroData(null)

    try {
      const sessionToken = localStorage.getItem('staff_session_token')
      if (!sessionToken) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch('/api/operacoes/qr-scanner/consultar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          qr_token: token
        })
      })

      const data = await response.json()

      if (data.success) {
        setMembroData(data)
        setSuccess(`Membro ${data.membro.nome} encontrado!`)
      } else {
        setError(data.error || 'Erro ao consultar QR Code')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao consultar QR:', err)
    } finally {
      setLoading(false)
    }
  }

  // Função para aplicar desconto
  const aplicarDesconto = async () => {
    if (!membroData?.success || !valorDesconto) {
      setError('Consulte um QR válido e informe o valor do desconto')
      return
    }

    const valor = parseFloat(valorDesconto)
    if (valor <= 0) {
      setError('Valor do desconto deve ser maior que zero')
      return
    }

    if (valor > (membroData.saldo_atual || 0)) {
      setError('Saldo insuficiente para aplicar este desconto')
      return
    }

    setLoading(true)
    setError('')

    try {
      const sessionToken = localStorage.getItem('staff_session_token')
      if (!sessionToken) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }

      const response = await fetch('/api/operacoes/qr-scanner/aplicar-desconto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          qr_token: qrToken,
          valor_desconto: valor
        })
      })

      const data = await response.json()

      if (data.success) {
        setLastTransaction(data)
        setSuccess(`Desconto de R$ ${valor.toFixed(2)} aplicado com sucesso!`)
        
        // Atualizar dados do membro
        await consultarQR(qrToken)
        
        // Limpar valor do desconto
        setValorDesconto('')
      } else {
        setError(data.error || 'Erro ao aplicar desconto')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao aplicar desconto:', err)
    } finally {
      setLoading(false)
    }
  }

  // Função para iniciar câmera
  const iniciarCamera = () => {
    setShowCamera(true)
    setError('')
    setSuccess('')
  }

  // Função chamada quando QR é detectado pela câmera
  const onQRDetected = (qrData: string) => {
    console.log('QR detectado pela câmera:', qrData)
    setQrToken(qrData)
    setShowCamera(false)
    
    // Auto-consultar dados do QR
    setTimeout(() => {
      consultarQR(qrData)
    }, 100)
  }

  // Função para fechar câmera
  const fecharCamera = () => {
    setShowCamera(false)
  }

  // Função para limpar dados
  const limparDados = () => {
    setQrToken('')
    setValorDesconto('')
    setMembroData(null)
    setLastTransaction(null)
    setError('')
    setSuccess('')
  }

  // Auto-consultar quando QR token for inserido
  useEffect(() => {
    if (qrToken.length > 10) { // QR tokens são longos
      const timer = setTimeout(() => {
        consultarQR(qrToken)
      }, 500) // Delay para evitar muitas consultas

      return () => clearTimeout(timer)
    }
  }, [qrToken])

  // Cleanup geral
  useEffect(() => {
    return () => {
      // Cleanup será feito pelo componente QRCameraScanner
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4">
            <Scan className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            QR Scanner - Fidelidade
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Escaneie o QR Code do membro para consultar saldo e aplicar descontos
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Scanner e Input */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scanner QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Botões de Scanner */}
              <div className="flex gap-2">
                <Button
                  onClick={iniciarCamera}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Escanear QR
                </Button>
                <Button
                  onClick={limparDados}
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Input Manual */}
              <div>
                <Label htmlFor="qr-token">
                  QR Code Token (Manual)
                </Label>
                <Input
                  id="qr-token"
                  placeholder="Cole ou digite o token do QR Code..."
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  disabled={loading}
                  className="input-dark"
                />
              </div>

              {/* Consultar Button */}
              <Button
                onClick={() => consultarQR(qrToken)}
                disabled={loading || !qrToken}
                className="w-full btn-primary-dark"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Consultar QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Dados do Membro */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados do Membro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membroData?.success ? (
                <div className="space-y-4">
                  {/* Info do Membro */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {membroData.membro?.nome}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {membroData.membro?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${
                        membroData.membro?.plano === 'premium' ? 'bg-yellow-500' :
                        membroData.membro?.plano === 'vip' ? 'bg-purple-500' :
                        'bg-blue-500'
                      } text-white`}>
                        {membroData.membro?.plano.toUpperCase()}
                      </Badge>
                      <Badge variant={membroData.pode_usar ? 'default' : 'destructive'}>
                        {membroData.pode_usar ? 'Ativo' : 'Sem Saldo'}
                      </Badge>
                    </div>
                  </div>

                  {/* Saldo */}
                  <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Saldo Disponível</p>
                        <p className="text-2xl font-bold">
                          R$ {(membroData.saldo_atual || 0).toFixed(2)}
                        </p>
                      </div>
                      <CreditCard className="w-8 h-8 text-green-100" />
                    </div>
                  </div>

                  {/* Aplicar Desconto */}
                  <div className="space-y-3">
                    <Label htmlFor="valor-desconto">
                      Valor do Desconto (R$)
                    </Label>
                    <Input
                      id="valor-desconto"
                      type="number"
                      step="0.01"
                      min="0"
                      max={membroData.saldo_atual}
                      placeholder="0.00"
                      value={valorDesconto}
                      onChange={(e) => setValorDesconto(e.target.value)}
                      disabled={loading || !membroData.pode_usar}
                      className="input-dark"
                    />
                    <Button
                      onClick={aplicarDesconto}
                      disabled={loading || !valorDesconto || !membroData.pode_usar}
                      className="w-full btn-success-dark"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Aplicar Desconto
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Escaneie ou digite um QR Code para ver os dados do membro
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Última Transação */}
        {lastTransaction?.success && (
          <Card className="card-dark mt-6">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Última Transação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Membro</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {lastTransaction.membro_nome}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Desconto Aplicado</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    - R$ {lastTransaction.valor_desconto?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Atual</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    R$ {lastTransaction.saldo_atual?.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Transação ID: {lastTransaction.transacao_id}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanner de Câmera */}
        <QRCameraScanner
          isOpen={showCamera}
          onScan={onQRDetected}
          onClose={fecharCamera}
        />
      </div>
    </div>
  )
}