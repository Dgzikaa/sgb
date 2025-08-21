'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, BarChart3, Sparkles, Loader2, Copy, Download } from 'lucide-react';
// import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartData?: any;
  chartType?: 'line' | 'bar' | 'pie' | 'composed' | 'area';
  data?: any;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'composed' | 'area';
  data: any[];
  title: string;
  description?: string;
}

export default function ModernAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      content: `👋 **Olá! Sou Claude, seu assistente AI integrado ao SGB.**`,
      timestamp: new Date()
    }]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversation_history: messages.slice(-10)
        }),
      });

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.message || 'Desculpe, não consegui processar sua solicitação.',
        timestamp: new Date(),
        chartData: result.chartData,
        chartType: result.chartType,
        data: result.data
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (result.chartData) {
        setActiveChart({
          type: result.chartType || 'line',
          data: result.chartData.data || [],
          title: result.chartData.title || 'Análise de Dados',
          description: result.chartData.description
        });
      }

    } catch (error) {
      console.error('Erro:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = (chartData: ChartData) => {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    switch (chartData.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <div>Tipo de gráfico não suportado</div>;
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const quickSuggestions = [
    { icon: "📊", text: "Vendas hoje", query: "📊 Analise as vendas de hoje" },
    { icon: "👥", text: "Comparar artistas", query: "👥 Compare performance dos artistas" },
    { icon: "📈", text: "Gráfico crescimento", query: "📈 Crie gráfico de crescimento mensal" },
    { icon: "💰", text: "Ticket médio", query: "💰 Qual o ticket médio atual?" },
    { icon: "🎯", text: "Top produtos", query: "🎯 Quais produtos vendem mais?" },
    { icon: "⏰", text: "Horário pico", query: "⏰ Qual horário tem mais movimento?" }
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar do Chat */}
      <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header do Chat */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Claude AI</h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Mensagens */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'assistant' && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="prose prose-sm max-w-none text-sm">
                        {message.content.split('\n').map((line, index) => (
                          <p key={index} className="whitespace-pre-wrap mb-1 last:mb-0 text-sm leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 px-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.type === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Sugestões Rápidas */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start h-7 text-xs px-2"
                onClick={() => setInput(suggestion.query)}
              >
                <span className="mr-1 text-xs">{suggestion.icon}</span>
                <span className="text-xs">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Input de Mensagem */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-sm h-8"
            />
            <Button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 h-8 px-3"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área Principal - Visualizações */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Visualizações
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gráficos e análises gerados pelo Claude
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <Sparkles className="w-4 h-4 mr-1" />
              IA Ativa
            </Badge>
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 p-6">
          {activeChart ? (
            <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 h-full">
                <div className="h-full flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {activeChart.title}
                        </h2>
                        {activeChart.description && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {activeChart.description}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    {renderChart(activeChart)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Aguardando análise
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Peça para o Claude criar um gráfico ou fazer uma análise dos seus dados
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Sugestões:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="cursor-pointer" onClick={() => setInput("📊 Crie um gráfico de vendas")}>
                      📊 Vendas
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer" onClick={() => setInput("👥 Compare artistas")}>
                      👥 Artistas  
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer" onClick={() => setInput("📈 Gráfico de crescimento")}>
                      📈 Crescimento
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
