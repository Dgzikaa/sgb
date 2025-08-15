'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Loader2, 
  Brain, 
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  DollarSign,
  Zap,
  Lightbulb,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNLP, type QueryAnalysis, type AIAnalysisResult } from '@/lib/ai/nlp-processor';
import { useZykorAI } from '@/lib/ai/setup';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  analysis?: QueryAnalysis;
  result?: AIAnalysisResult;
  loading?: boolean;
  error?: string;
  feedback?: 'positive' | 'negative';
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'sales_today',
    label: 'Vendas de Hoje',
    query: 'Como foram as vendas hoje?',
    icon: DollarSign,
    category: 'Vendas'
  },
  {
    id: 'weekly_growth',
    label: 'Crescimento Semanal',
    query: 'Qual foi o crescimento desta semana comparado à semana passada?',
    icon: TrendingUp,
    category: 'Análise'
  },
  {
    id: 'customer_insights',
    label: 'Insights de Clientes',
    query: 'Analise o comportamento dos clientes no último mês',
    icon: Users,
    category: 'Clientes'
  },
  {
    id: 'event_performance',
    label: 'Performance de Eventos',
    query: 'Como foi a performance dos últimos eventos?',
    icon: Calendar,
    category: 'Eventos'
  },
  {
    id: 'recommendations',
    label: 'Recomendações',
    query: 'Que melhorias você recomenda para aumentar as vendas?',
    icon: Lightbulb,
    category: 'Estratégia'
  },
  {
    id: 'monthly_summary',
    label: 'Resumo Mensal',
    query: 'Faça um resumo completo deste mês',
    icon: BarChart3,
    category: 'Relatórios'
  }
];

export default function ZykorAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { analyzeQuery, processQueryWithContext } = useNLP();
  const { getUsageStats, getProviderStatus } = useZykorAI();

  // Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensagem de boas-vindas
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'system',
      content: 'Olá! Sou o Zykor AI Assistant 🤖\n\nPosso ajudar você a analisar dados do seu bar, identificar tendências e dar recomendações estratégicas.\n\nPergunte algo como:\n• "Como foram as vendas esta semana?"\n• "Qual o meu crescimento comparado ao mês passado?"\n• "Que eventos tiveram melhor performance?"',
      timestamp: Date.now()
    };
    
    setMessages([welcomeMessage]);
  }, []);

  // Processar mensagem do usuário
  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setShowQuickActions(false);

    // Adicionar mensagem de loading da IA
    const loadingMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content: 'Analisando sua consulta...',
      timestamp: Date.now(),
      loading: true
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Analisar consulta
      const analysis = analyzeQuery(text);
      
      // Simular dados do contexto (em produção, viria do banco)
      const mockDataContext = {
        currentDate: new Date().toISOString(),
        barInfo: {
          name: 'Bar Exemplo',
          location: 'São Paulo, SP'
        },
        recentMetrics: {
          dailySales: 2847.50,
          weeklyGrowth: 18.2,
          customerCount: 147,
          averageTicket: 89.40,
          eventCount: 3
        }
      };

      // Processar com IA
      const result = await processQueryWithContext(text, mockDataContext);

      // Atualizar mensagem com resultado
      const aiResponse: ChatMessage = {
        id: loadingMessage.id,
        type: 'ai',
        content: result.summary,
        timestamp: Date.now(),
        analysis,
        result,
        loading: false
      };

      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessage.id ? aiResponse : msg)
      );

    } catch (error) {
      console.error('Erro ao processar consulta:', error);
      
      const errorMessage: ChatMessage = {
        id: loadingMessage.id,
        type: 'ai',
        content: 'Desculpe, ocorreu um erro ao processar sua consulta. Tente novamente.',
        timestamp: Date.now(),
        loading: false,
        error: (error as Error).message
      };

      setMessages(prev => 
        prev.map(msg => msg.id === loadingMessage.id ? errorMessage : msg)
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Reconhecimento de voz (simulado)
  const toggleVoiceRecognition = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simular reconhecimento de voz
      setTimeout(() => {
        setInputValue('Como foram as vendas hoje?');
        setIsListening(false);
      }, 2000);
    }
  };

  // Copiar resposta
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Dar feedback na resposta
  const provideFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
  };

  // Exportar conversa
  const exportChat = () => {
    const chatText = messages
      .filter(msg => msg.type !== 'system')
      .map(msg => `${msg.type === 'user' ? 'Você' : 'Zykor AI'}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zykor-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Zykor AI Assistant</h3>
              <p className="text-sm text-white/60">Análise inteligente de dados</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              <Sparkles className="w-3 h-3 mr-1" />
              Online
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportChat}
              className="text-white/60 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="p-4 border-b border-white/10"
        >
          <p className="text-sm text-white/60 mb-3">Ações rápidas:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(action.query)}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-left justify-start"
                disabled={isProcessing}
              >
                <action.icon className="w-4 h-4 mr-2" />
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type !== 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {message.type === 'system' ? (
                    <MessageCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                <div className={`p-4 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : message.type === 'system'
                    ? 'bg-white/5 border border-white/10 text-white/80'
                    : 'bg-white/10 border border-white/20 text-white'
                }`}>
                  {message.loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      
                      {/* Análise da consulta */}
                      {message.analysis && (
                        <div className="mt-3 p-3 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-400">Análise da Consulta</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-white/60">Intenção:</span>
                              <span className="ml-2 text-white">{message.analysis.intent.type}</span>
                            </div>
                            <div>
                              <span className="text-white/60">Categoria:</span>
                              <span className="ml-2 text-white">{message.analysis.intent.category}</span>
                            </div>
                            <div>
                              <span className="text-white/60">Complexidade:</span>
                              <span className="ml-2 text-white">{message.analysis.complexity}</span>
                            </div>
                            <div>
                              <span className="text-white/60">Confiança:</span>
                              <span className="ml-2 text-white">{Math.round(message.analysis.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Insights e recomendações */}
                      {message.result && (
                        <div className="space-y-3">
                          {message.result.insights.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                Insights
                              </h4>
                              <ul className="space-y-1">
                                {message.result.insights.map((insight, index) => (
                                  <li key={index} className="text-sm text-white/80 flex items-start gap-2">
                                    <span className="text-blue-400 mt-1">•</span>
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {message.result.recommendations.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                                <Lightbulb className="w-4 h-4" />
                                Recomendações
                              </h4>
                              <ul className="space-y-1">
                                {message.result.recommendations.map((rec, index) => (
                                  <li key={index} className="text-sm text-white/80 flex items-start gap-2">
                                    <span className="text-green-400 mt-1">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {Object.keys(message.result.metrics).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-1">
                                <PieChart className="w-4 h-4" />
                                Métricas
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(message.result.metrics).map(([key, value]) => (
                                  <div key={key} className="text-sm">
                                    <span className="text-white/60">{key}:</span>
                                    <span className="ml-2 text-white font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions para mensagens da IA */}
                {message.type === 'ai' && !message.loading && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.content)}
                      className="h-6 px-2 text-white/60 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => provideFeedback(message.id, 'positive')}
                      className={`h-6 px-2 ${
                        message.feedback === 'positive' 
                          ? 'text-green-400' 
                          : 'text-white/60 hover:text-green-400'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => provideFeedback(message.id, 'negative')}
                      className={`h-6 px-2 ${
                        message.feedback === 'negative' 
                          ? 'text-red-400' 
                          : 'text-white/60 hover:text-red-400'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                    {message.error && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendMessage(messages.find(m => m.id === message.id - 1)?.content || '')}
                        className="h-6 px-2 text-white/60 hover:text-white"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}

                <div className="text-xs text-white/40 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Pergunte sobre vendas, clientes, eventos ou peça recomendações..."
              className="bg-white/10 border-white/20 text-white placeholder-white/50 pr-12"
              disabled={isProcessing}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoiceRecognition}
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
                isListening ? 'text-red-400' : 'text-white/60 hover:text-white'
              }`}
              disabled={isProcessing}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-white/40">
          <span>Pressione Enter para enviar</span>
          <span>Powered by Zykor AI</span>
        </div>
      </div>
    </div>
  );
}
