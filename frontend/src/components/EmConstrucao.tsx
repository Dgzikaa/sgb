'use client'

import { Construction, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EmConstrucaoProps {
  titulo: string
  descricao?: string
  prioridade?: 'alta' | 'media' | 'baixa'
  previsao?: string
}

export default function EmConstrucao({ 
  titulo, 
  descricao = "Esta página está sendo desenvolvida e estará disponível em breve.",
  prioridade = 'media',
  previsao 
}: EmConstrucaoProps) {
  const router = useRouter()

  const corPrioridade = {
    alta: 'bg-red-100 text-red-800 border-red-200',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    baixa: 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const textoPrioridade = {
    alta: 'Alta Prioridade',
    media: 'Prioridade Média',
    baixa: 'Baixa Prioridade'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Ícone Principal */}
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full">
            <Construction className="h-12 w-12 text-orange-600" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {titulo}
        </h1>

        {/* Descrição */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {descricao}
        </p>

        {/* Badge de Prioridade */}
        <div className="flex justify-center mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${corPrioridade[prioridade]}`}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {textoPrioridade[prioridade]}
          </span>
        </div>

        {/* Previsão (se fornecida) */}
        {previsao && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-blue-800">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Previsão: {previsao}
              </span>
            </div>
          </div>
        )}

        {/* Botão Voltar */}
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </button>

        {/* Rodapé */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            SGB V2 • Sistema em Desenvolvimento
          </p>
        </div>
      </div>
    </div>
  )
} 