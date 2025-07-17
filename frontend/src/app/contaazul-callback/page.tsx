'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ContaAzulCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autorização...');
  const [details, setDetails] = useState<any>(null);
  const hasProcessed = useRef(false); // Proteção contra múltiplas execuções

  useEffect(() => {
    // Se já foi processado, não executar novamente
    if (hasProcessed.current) {
      console.log('🔍 CALLBACK PAGE - Já foi processado, ignorando...');
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');
    
    console.log('🔍 CALLBACK PAGE - Parâmetros recebidos:', {
      code: code ? 'presente' : 'ausente',
      state: state ? 'presente' : 'ausente',
      error,
      error_description
    });
    
    if (error) {
      hasProcessed.current = true;
      setStatus('error');
      setMessage(`Erro de autorização: ${error}`);
      if (error_description) {
        setDetails({ error_description });
      }
      return;
    }
    
    if (!code || !state) {
      hasProcessed.current = true;
      setStatus('error');
      setMessage('Parâmetros de autorização ausentes');
      return;
    }
    
    // Marcar como processando para evitar múltiplas execuções
    hasProcessed.current = true;
    
    // Processar callback diretamente
    processCallback(code, state);
  }, [searchParams]); // Dependência apenas nos searchParams

  const processCallback = async (code: string, state: string) => {
    try {
      console.log('🔍 CALLBACK PAGE - Iniciando processamento callback');
      
      // Chamar a API diretamente - ela vai extrair o barId do state
      const response = await fetch(`/api/contaazul/auth?action=callback&code=${code}&state=${state}`);
      const data = await response.json();
      
      console.log('🔍 CALLBACK PAGE - Resposta da API:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar callback');
      }
      
      setStatus('success');
      setMessage('Autorização realizada com sucesso!');
      setDetails(data);
      
      // Marcar OAuth como concluído no localStorage para o componente detectar
      localStorage.setItem('contaazul_oauth_completed', 'true');
      
      // Limpar dados temporários
      localStorage.removeItem('contaazul_bar_id');
      
      // Marcar que OAuth foi concluído para selecionar aba API
      localStorage.setItem('select_api_tab', 'true');
      
      // Redirecionar para a URL atual (Vercel ou localhost) após 3 segundos
      setTimeout(() => {
        const baseUrl = window.location.origin; // Detecta automaticamente https://sgbv2.vercel.app ou http://localhost:3001
        window.location.href = `${baseUrl}/configuracoes?tab=integracoes&oauth_success=true`;
      }, 3000);
    } catch (error) {
      console.error('❌ CALLBACK PAGE - Erro:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Erro ao processar autorização');
      setDetails({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        state: state ? 'State presente' : 'State ausente',
        code: code ? 'Code presente' : 'Code ausente'
      });
    }
  };

  const handleRetry = () => {
    router.push('/configuracoes');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className={`max-w-md w-full ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle>{message}</CardTitle>
          {status === 'loading' && (
            <CardDescription>
              Aguarde enquanto finalizamos a integração com o ContaAzul...
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {details && (
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {details.message || JSON.stringify(details, null, 2)}
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Você será redirecionado em breve...</span>
            </div>
          )}
          
          {status === 'error' && (
            <Button onClick={handleRetry} className="w-full">
              Voltar para Configurações
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
