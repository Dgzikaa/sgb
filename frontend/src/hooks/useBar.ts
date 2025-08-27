'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Bar {
  id: number;
  nome: string;
  slug?: string;
  ativo?: boolean;
}

export function useBar() {
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchBar() {
      if (!user?.bar_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/configuracoes/bars/user-bars');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar informações do bar');
        }

        const data = await response.json();
        
        if (data.success && data.bars && data.bars.length > 0) {
          // Encontrar o bar do usuário
          const userBar = data.bars.find((b: Bar) => b.id === user.bar_id) || data.bars[0];
          setBar(userBar);
        } else {
          setError('Nenhum bar encontrado');
        }
      } catch (err) {
        console.error('Erro ao buscar bar:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchBar();
  }, [user?.bar_id]);

  return {
    bar,
    selectedBar: bar, // Alias para compatibilidade
    loading,
    error,
    refetch: () => {
      if (user?.bar_id) {
        setLoading(true);
        // Re-executar o useEffect
      }
    }
  };
}
