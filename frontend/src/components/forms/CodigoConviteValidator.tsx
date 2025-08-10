'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, X, Loader2, AlertCircle, Shield, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CodigoConviteValidatorProps {
  onValidacaoSucesso: (dadosValidacao: any) => void
  className?: string
}

export default function CodigoConviteValidator({ 
  onValidacaoSucesso, 
  className = '' 
}: CodigoConviteValidatorProps) {
  const [codigo, setCodigo] = useState('')
  const [cpf, setCpf] = useState('')
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState<{
    tipo: 'sucesso' | 'erro' | 'warning' | null
    mensagem: string
    detalhes?: string
  }>({ tipo: null, mensagem: '' })

  // Formatar CPF enquanto digita
  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').substring(0, 11)
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setCpf(formatarCPF(valor))
    // Limpar resultado anterior
    if (resultado.tipo) {
      setResultado({ tipo: null, mensagem: '' })
    }
  }

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toUpperCase()
    setCodigo(valor)
    // Limpar resultado anterior
    if (resultado.tipo) {
      setResultado({ tipo: null, mensagem: '' })
    }
  }

  const validarDados = async () => {
    if (!codigo.trim()) {
      setResultado({
        tipo: 'erro',
        mensagem: 'Digite seu código de convite',
        detalhes: 'O código foi enviado por WhatsApp'
      })
      return
    }

    if (!cpf.trim() || cpf.replace(/\D/g, '').length !== 11) {
      setResultado({
        tipo: 'erro',
        mensagem: 'Digite um CPF válido',
        detalhes: 'O CPF deve ter 11 dígitos'
      })
      return
    }

    setValidando(true)
    setResultado({ tipo: null, mensagem: '' })

    try {
      const response = await fetch('/api/fidelidade/validar-codigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: codigo.trim(),
          cpf: cpf.replace(/\D/g, ''),
          bar_id: 1 // TODO: Pegar do contexto
        }),
      })

      const data = await response.json()

      if (data.valido) {
        setResultado({
          tipo: 'sucesso',
          mensagem: 'Código válido! ✅',
          detalhes: data.mensagem
        })
        
        // Chamar callback com dados de validação
        setTimeout(() => {
          onValidacaoSucesso(data)
        }, 1500)
        
      } else {
        setResultado({
          tipo: 'erro',
          mensagem: data.error,
          detalhes: data.detalhes
        })
      }
    } catch (error) {
      console.error('Erro na validação:', error)
      setResultado({
        tipo: 'erro',
        mensagem: 'Erro de conexão',
        detalhes: 'Tente novamente em alguns segundos'
      })
    } finally {
      setValidando(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validarDados()
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Campo Código de Convite */}
        <div className="space-y-2">
          <Label htmlFor="codigo" className="text-amber-200 text-lg font-semibold flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-300" />
            Código de Convite Exclusivo
          </Label>
          <div className="relative">
            <Input
              id="codigo"
              type="text"
              placeholder="ORDINARIO-VIP-XXX"
              value={codigo}
              onChange={handleCodigoChange}
              className="bg-black/50 border-2 border-amber-400/50 rounded-2xl px-6 py-4 text-white text-xl font-mono text-center placeholder-amber-300/50 focus:border-amber-300 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
              disabled={validando}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Campo CPF */}
        <div className="space-y-2">
          <Label htmlFor="cpf" className="text-amber-200 text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-300" />
            CPF
          </Label>
          <Input
            id="cpf"
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCPFChange}
            className="bg-black/50 border-2 border-amber-400/50 rounded-2xl px-6 py-4 text-white text-xl text-center placeholder-amber-300/50 focus:border-amber-300 focus:ring-2 focus:ring-amber-500/30 transition-all duration-300"
            disabled={validando}
          />
        </div>

        {/* Botão de Validação */}
        <Button
          type="submit"
          disabled={validando || !codigo.trim() || !cpf.trim()}
          className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 border-0 px-8 py-4 text-lg font-bold shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {validando ? (
            <>
              <Loader2 className="mr-3 w-5 h-5 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <Check className="mr-3 w-5 h-5" />
              Validar Convite
            </>
          )}
        </Button>

        {/* Resultado da Validação */}
        <AnimatePresence>
          {resultado.tipo && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl p-4 border-2 ${
                resultado.tipo === 'sucesso'
                  ? 'bg-green-500/20 border-green-400/50 text-green-100'
                  : resultado.tipo === 'erro'
                  ? 'bg-red-500/20 border-red-400/50 text-red-100'
                  : 'bg-yellow-500/20 border-yellow-400/50 text-yellow-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {resultado.tipo === 'sucesso' ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : resultado.tipo === 'erro' ? (
                    <X className="w-5 h-5 text-red-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{resultado.mensagem}</p>
                  {resultado.detalhes && (
                    <p className="text-sm opacity-80 mt-1">{resultado.detalhes}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informações de Segurança */}
        <div className="text-center space-y-2">
          <p className="text-amber-300/70 text-sm">
            🔒 Código enviado por WhatsApp • Válido por tempo limitado
          </p>
          <p className="text-amber-300/50 text-xs">
            Cada código e CPF podem ser usados apenas uma vez
          </p>
        </div>
      </form>
    </div>
  )
}
