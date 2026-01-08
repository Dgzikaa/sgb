'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBar } from '@/contexts/BarContext';
import { useUser } from '@/contexts/UserContext';
import { usePageTitle } from '@/contexts/PageTitleContext';
import { 
  Send, 
  Sparkles, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  BarChart3,
  Zap,
  Bot,
  User,
  Loader2,
  ChevronRight,
  Clock,
  Target,
  Package
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: string;
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  suggestions?: string[];
  isTyping?: boolean;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Faturamento da semana', prompt: 'Qual foi o faturamento dessa semana?' },
  { icon: Users, label: 'Clientes ontem', prompt: 'Quantos clientes vieram ontem?' },
  { icon: DollarSign, label: 'Ticket médio', prompt: 'Qual o ticket médio atual?' },
  { icon: Target, label: 'Status das metas', prompt: 'Como está o progresso das metas do mês?' },
  { icon: Package, label: 'CMV atual', prompt: 'Qual o CMV da última semana?' },
  { icon: Calendar, label: 'Melhor dia', prompt: 'Qual foi o melhor dia dessa semana?' },
];

export default function AgenteChatPage() {
  const { setPageTitle } = usePageTitle();
  const { selectedBar } = useBar();
  const { user } = useUser();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPageTitle('🤖 Agente Zykor');
  }, [setPageTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setShowWelcome(false);
    setInput('');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Adicionar mensagem de "digitando"
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          barId: selectedBar?.id || 3,
          userId: user?.id,
          context: {
            barName: selectedBar?.nome || 'Ordinário',
            previousMessages: messages.slice(-5).map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        })
      });

      const result = await response.json();

      // Remover mensagem de digitando
      setMessages(prev => prev.filter(m => m.id !== 'typing'));

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
          agent: result.agent,
          metrics: result.metrics,
          suggestions: result.suggestions
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Desculpe, não consegui processar sua solicitação. Tente novamente.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erro de conexão. Verifique sua internet e tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex flex-col overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Chat Container */}
      <div className="relative flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          
          {/* Welcome Screen */}
          <AnimatePresence>
            {showWelcome && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-full py-12"
              >
                {/* Logo/Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="relative mb-8"
                >
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-gray-900 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                </motion.div>

                {/* Greeting */}
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {getGreeting()}, {user?.nome?.split(' ')[0] || 'Gestor'}!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-400 text-lg mb-8 text-center max-w-md"
                >
                  Sou o agente do <span className="text-purple-400 font-semibold">Zykor</span>. 
                  Posso analisar dados do {selectedBar?.nome || 'bar'} e responder suas dúvidas.
                </motion.p>

                {/* Quick Prompts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl"
                >
                  {QUICK_PROMPTS.map((item, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSend(item.prompt)}
                      className="group flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800 transition-all text-left"
                    >
                      <div className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-purple-500/20 transition-colors">
                        <item.icon className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Agent Tag */}
                  {message.agent && (
                    <span className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {message.agent}
                    </span>
                  )}
                  
                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-md'
                      : 'bg-gray-800 text-gray-100 rounded-tl-md border border-gray-700/50'
                  }`}>
                    {message.isTyping ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-gray-400 text-sm">Analisando dados...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    )}
                  </div>

                  {/* Metrics Cards */}
                  {message.metrics && message.metrics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.metrics.map((metric, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700/50"
                        >
                          <span className="text-xs text-gray-400">{metric.label}</span>
                          <span className={`text-sm font-semibold ${
                            metric.trend === 'up' ? 'text-green-400' :
                            metric.trend === 'down' ? 'text-red-400' : 'text-white'
                          }`}>
                            {metric.value}
                          </span>
                          {metric.trend && (
                            <TrendingUp className={`w-3 h-3 ${
                              metric.trend === 'up' ? 'text-green-400' :
                              metric.trend === 'down' ? 'text-red-400 rotate-180' : 'text-gray-400'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(suggestion)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-500/20 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="relative py-4">
          <div className="relative flex items-end gap-3 p-2 rounded-2xl bg-gray-800/80 border border-gray-700/50 backdrop-blur-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre o Zykor..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none px-4 py-3 max-h-32 text-sm"
              style={{ minHeight: '48px' }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-xl transition-all ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
          
          {/* Hint */}
          <p className="text-center text-xs text-gray-600 mt-2">
            Pressione <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">Enter</kbd> para enviar
          </p>
        </div>
      </div>
    </div>
  );
}
