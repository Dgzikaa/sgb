'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AvaliacaoEmojiField, { 
  AvaliacaoSatisfacao, 
  AvaliacaoQualidade, 
  AvaliacaoEstrelas,
  AvaliacaoEmojis,
  useAvaliacaoEmoji 
} from '@/components/form-fields/AvaliacaoEmojiField'

// =====================================================
// 🎭 DEMONSTRAÇÃO DO CAMPO DE AVALIAÇÃO COM EMOJIS
// =====================================================
// Página para testar e demonstrar o novo componente
// conforme documento Word: "O campo de avaliação eu gosto de poder usar as carinhas"

export default function DemoAvaliacaoPage() {
  // Estados para diferentes tipos de avaliação
  const [avaliacaoGeral, setAvaliacaoGeral] = useState<number>()
  const [satisfacao, setSatisfacao] = useState<number>()
  const [qualidade, setQualidade] = useState<number>()
  const [estrelas, setEstrelas] = useState<number>()

  // Usando o hook customizado
  const limpeza = useAvaliacaoEmoji()
  const atendimento = useAvaliacaoEmoji(4) // Com valor inicial

  const resetarTodas = () => {
    setAvaliacaoGeral(undefined)
    setSatisfacao(undefined)
    setQualidade(undefined)
    setEstrelas(undefined)
    limpeza.reset()
    atendimento.reset()
  }

  const mostrarResumo = () => {
    const valores = {
      'Avaliação Geral': avaliacaoGeral,
      'Satisfação': satisfacao,
      'Qualidade': qualidade,
      'Estrelas': estrelas,
      'Limpeza': limpeza.valor,
      'Atendimento': atendimento.valor
    }

    console.log('Valores das avaliações:', valores)
    alert(`Resumo das Avaliações:\n${Object.entries(valores)
      .map(([key, value]) => `${key}: ${value || 'Não avaliado'}`)
      .join('\n')}`)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎭 Campo de Avaliação com Emojis
        </h1>
        <p className="text-gray-600">
          Demonstração do novo componente de avaliação conforme especificação: 
          <em>"O campo de avaliação eu gosto de poder usar as carinhas"</em>
        </p>
        <div className="flex gap-2 mt-4">
          <Button onClick={mostrarResumo} variant="outline">
            📊 Ver Resumo
          </Button>
          <Button onClick={resetarTodas} variant="outline">
            🔄 Resetar Tudo
          </Button>
        </div>
      </div>

      {/* Grid de Demonstrações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Avaliação com Emojis Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              😍 Emojis Gerais
              {avaliacaoGeral && <Badge variant="outline">Valor: {avaliacaoGeral}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvaliacaoEmojis
              label="Como foi sua experiência?"
              value={avaliacaoGeral}
              onChange={setAvaliacaoGeral}
              descricao="Avalie usando as carinhas que melhor representa sua experiência"
              obrigatorio={true}
            />
          </CardContent>
        </Card>

        {/* Avaliação de Satisfação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              😁 Satisfação
              {satisfacao && <Badge variant="outline">Valor: {satisfacao}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvaliacaoSatisfacao
              label="Nível de satisfação"
              value={satisfacao}
              onChange={setSatisfacao}
              descricao="Como você se sente em relação ao serviço?"
              size="lg"
            />
          </CardContent>
        </Card>

        {/* Avaliação de Qualidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Qualidade
              {qualidade && <Badge variant="outline">Valor: {qualidade}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvaliacaoQualidade
              label="Qualidade do produto"
              value={qualidade}
              onChange={setQualidade}
              descricao="Avalie a qualidade geral"
              obrigatorio={true}
            />
          </CardContent>
        </Card>

        {/* Avaliação com Estrelas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⭐ Estrelas
              {estrelas && <Badge variant="outline">Valor: {estrelas}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvaliacaoEstrelas
              label="Classificação por estrelas"
              value={estrelas}
              onChange={setEstrelas}
              descricao="Sistema tradicional de avaliação"
              size="sm"
            />
          </CardContent>
        </Card>

        {/* Usando Hook Customizado - Limpeza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧹 Limpeza (Hook)
              {limpeza.valor && <Badge variant="outline">Valor: {limpeza.valor}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvaliacaoEmojiField
              label="Avaliação da Limpeza"
              value={limpeza.valor}
              onChange={limpeza.setValor}
              variant="faces"
              descricao="Usando hook customizado para gerenciar estado"
            />
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Hook Info:</strong>
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Válido: {limpeza.isValid(true) ? '✅' : '❌'}</li>
                <li>• Label: {limpeza.getLabel('faces') || 'Nenhuma'}</li>
                <li>• Emoji: {limpeza.getEmoji('faces') || 'Nenhum'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Usando Hook Customizado - Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👥 Atendimento (Hook)
              {atendimento.valor && <Badge variant="outline">Valor: {atendimento.valor}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AvaliacaoEmojiField
              label="Avaliação do Atendimento"
              value={atendimento.valor}
              onChange={atendimento.setValor}
              variant="qualidade"
              descricao="Hook iniciado com valor 4 (pré-selecionado)"
              obrigatorio={true}
            />
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={atendimento.reset}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo dos Valores */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📋 Resumo dos Valores Atuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <strong>Avaliação Geral:</strong> {avaliacaoGeral || 'Não avaliado'}
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Satisfação:</strong> {satisfacao || 'Não avaliado'}
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Qualidade:</strong> {qualidade || 'Não avaliado'}
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Estrelas:</strong> {estrelas || 'Não avaliado'}
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Limpeza:</strong> {limpeza.valor || 'Não avaliado'}
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Atendimento:</strong> {atendimento.valor || 'Não avaliado'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemplos de Uso em Formulários */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>💡 Exemplos de Uso em Checklists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Simulação Checklist Cozinha */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium text-orange-700 mb-3">
                🍳 Checklist Cozinha - Avaliações
              </h4>
              <div className="space-y-4">
                <AvaliacaoQualidade
                  label="Qualidade da limpeza geral"
                  value={undefined}
                  onChange={() => {}}
                  size="sm"
                  showDescription={false}
                />
                <AvaliacaoEmojis
                  label="Como está o ambiente?"
                  value={undefined}
                  onChange={() => {}}
                  size="sm"
                  showDescription={false}
                />
              </div>
            </div>

            {/* Simulação Checklist Bar */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-blue-700 mb-3">
                🍺 Checklist Bar - Avaliações
              </h4>
              <div className="space-y-4">
                <AvaliacaoSatisfacao
                  label="Satisfação com o estoque"
                  value={undefined}
                  onChange={() => {}}
                  size="sm"
                  showDescription={false}
                />
                <AvaliacaoEstrelas
                  label="Organização geral"
                  value={undefined}
                  onChange={() => {}}
                  size="sm"
                  showDescription={false}
                />
              </div>
            </div>

            {/* Simulação Checklist Salão */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-green-700 mb-3">
                🪑 Checklist Salão - Avaliações
              </h4>
              <div className="space-y-4">
                <AvaliacaoEmojis
                  label="Ambiente para clientes"
                  value={undefined}
                  onChange={() => {}}
                  size="sm"
                  showDescription={false}
                />
                <AvaliacaoQualidade
                  label="Estado das mesas e cadeiras"
                  value={undefined}
                  onChange={() => {}}
                  size="sm"
                  showDescription={false}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 