'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Check, X, AlertTriangle } from 'lucide-react'

interface Usuario {
  id: number
  nome: string
  email: string
  celular: string | null
  ativo: boolean
}

interface UsuarioCelularFormProps {
  usuarioId?: number
  onSave?: (usuario: Usuario) => void
  showValidation?: boolean
}

export default function UsuarioCelularForm({ 
  usuarioId, 
  onSave,
  showValidation = true 
}: UsuarioCelularFormProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [celular, setCelular] = useState('')
  const [loading, setLoading] = useState(false)
  const [testingWhatsApp, setTestingWhatsApp] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown')

  useEffect(() => {
    if (usuarioId) {
      loadUsuario()
    }
  }, [usuarioId])

  const loadUsuario = async () => {
    try {
      const response = await fetch(`/api/usuarios/${usuarioId}`)
      const data = await response.json()
      
      if (data.success) {
        setUsuario(data.usuario)
        setCelular(data.usuario.celular || '')
      }
    } catch (error) {
      console.error('Erro ao carregar usuÃ¡Â¡rio:', error)
    }
  }

  const formatCelular = (value: string) => {
    // Remove tudo que nÃ¡Â£o Ã¡Â© nÃ¡Âºmero
    const numbers = value.replace(/\D/g, '')
    
    // Formatar: +55 (XX) 9XXXX-XXXX
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '+55 ($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(\d{4})-(\d{4})/, '$1-$2')
    }
    
    return value
  }

  const validateCelular = (cel: string) => {
    const numbers = cel.replace(/\D/g, '')
    
    // Deve ter 11 dÃ¡Â­gitos: DD9XXXXXXXX
    if (numbers.length !== 11) return false
    
    // Deve comeÃ¡Â§ar com DDD vÃ¡Â¡lido (11-99)
    const ddd = parseInt(numbers.substring(0, 2))
    if (ddd < 11 || ddd > 99) return false
    
    // Terceiro dÃ¡Â­gito deve ser 9 (celular)
    if (numbers[2] !== '9') return false
    
    return true
  }

  const testWhatsApp = async () => {
    if (!celular || !validateCelular(celular)) return
    
    setTestingWhatsApp(true)
    setWhatsappStatus('unknown')
    
    try {
      const numbers = celular.replace(/\D/g, '')
      
      const response = await fetch('/api/whatsapp/test-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          numero: numbers,
          mensagem: `Ã°Å¸â€œÂ± Teste de WhatsApp - SGB\n\nOlÃ¡Â¡! Este Ã¡Â© um teste de conectividade.\n\nSe vocÃ¡Âª recebeu esta mensagem, seu nÃ¡Âºmero estÃ¡Â¡ funcionando perfeitamente para receber notificaÃ¡Â§Ã¡Âµes do sistema!\n\nÅ“â€¦ NÃ¡Âºmero validado: +${numbers}\n\n_Sistema SGB - ${new Date().toLocaleString('pt-BR')}_`
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setWhatsappStatus('valid')
      } else {
        setWhatsappStatus('invalid')
      }
      
    } catch (error) {
      console.error('Erro ao testar WhatsApp:', error)
      setWhatsappStatus('invalid')
    } finally {
      setTestingWhatsApp(false)
    }
  }

  const handleSave = async () => {
    if (!validateCelular(celular)) {
      alert('NÃ¡Âºmero de celular invÃ¡Â¡lido! Use o formato: +55 (XX) 9XXXX-XXXX')
      return
    }

    setLoading(true)
    
    try {
      const numbers = celular.replace(/\D/g, '')
      
      const response = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          celular: numbers // Salvar apenas nÃ¡Âºmeros
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (onSave && usuario) {
          onSave({ ...usuario, celular: numbers })
        }
        alert('Celular salvo com sucesso!')
      } else {
        alert('Erro ao salvar celular: ' + result.error)
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar celular')
    } finally {
      setLoading(false)
    }
  }

  const isValid = validateCelular(celular)

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          WhatsApp do FuncionÃ¡Â¡rio
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {usuario ? `Configure o WhatsApp de ${usuario.nome}` : 'Configure o nÃ¡Âºmero para receber notificaÃ¡Â§Ã¡Âµes'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Campo de Celular */}
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">
            NÃ¡Âºmero do WhatsApp
          </Label>
          <div className="relative">
            <Input
              value={celular}
              onChange={(e) => setCelular(formatCelular(e.target.value))}
              placeholder="+55 (61) 99999-9999"
              className={`bg-white dark:bg-gray-700 border ${
                celular && !isValid 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } text-gray-900 dark:text-white`}
              maxLength={18}
            />
            
            {/* Status de ValidaÃ¡Â§Ã¡Â£o */}
            {celular && (
              <div className="absolute right-3 top-3">
                {isValid ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          
          {/* Mensagem de ValidaÃ¡Â§Ã¡Â£o */}
          {celular && !isValid && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Formato invÃ¡Â¡lido. Use: +55 (XX) 9XXXX-XXXX
            </div>
          )}
        </div>

        {/* Status WhatsApp */}
        {showValidation && whatsappStatus !== 'unknown' && (
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">
              Status do WhatsApp
            </Label>
            <div className="flex items-center gap-2">
              {whatsappStatus === 'valid' ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Å“â€¦ WhatsApp Funcionando
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  ÂÅ’ WhatsApp IndisponÃ¡Â­vel
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* BotÃ¡Âµes */}
        <div className="flex gap-3 pt-4">
          {showValidation && (
            <Button
              variant="outline"
              onClick={testWhatsApp}
              disabled={!isValid || testingWhatsApp}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {testingWhatsApp ? 'Testando...' : 'Testar WhatsApp'}
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={!isValid || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Salvando...' : 'Salvar Celular'}
          </Button>
        </div>

        {/* InformaÃ¡Â§Ã¡Âµes de SeguranÃ¡Â§a */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            Ã°Å¸â€ºÂ¡Ã¯Â¸Â InformaÃ¡Â§Ã¡Âµes de SeguranÃ¡Â§a
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>â‚¬Â¢ MÃ¡Â¡ximo 50 mensagens por dia por nÃ¡Âºmero</li>
            <li>â‚¬Â¢ Intervalo mÃ¡Â­nimo de 30 segundos entre mensagens</li>
            <li>â‚¬Â¢ Funcionamento apenas em horÃ¡Â¡rio comercial (8h Ã¡Â s 18h)</li>
            <li>â‚¬Â¢ Mensagens personalizadas para evitar spam</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 

