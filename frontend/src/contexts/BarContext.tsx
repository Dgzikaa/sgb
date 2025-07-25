'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';

interface Bar {
  id: number;
  nome: string;
}

interface BarContextType {
  selectedBar: Bar | null;
  availableBars: Bar[];
  setSelectedBar: (bar: Bar) => void;
  isLoading: boolean;
  resetBars: () => void;
}

const BarContext = createContext<BarContextType | undefined>(undefined);

export function BarProvider({ children }: { children: ReactNode }) {
  const { user, isInitialized: userInitialized } = useUser();
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [availableBars, setAvailableBars] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const resetBars = () => {
    setSelectedBar(null);
    setAvailableBars([]);
    setIsLoading(true);
    // Resetar favicon para default
    updateFavicon();
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function loadUserBars() {
      try {
        // Aguardar que o UserContext seja inicializado
        if (!userInitialized) {
          return;
        }

        const supabase = await getSupabaseClient();
        if (!supabase) {
          if (mounted) setIsLoading(false);
          return;
        }

        // Se há usuário no contexto, buscar os bares do localStorage
        if (user && user.email) {
          // Buscar dados completos do localStorage que podem conter availableBars
          const storedUserData = localStorage.getItem('sgb_user');
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              if (
                userData.availableBars &&
                Array.isArray(userData.availableBars) &&
                userData.availableBars.length > 0
              ) {
                if (mounted) {
                  setAvailableBars(userData.availableBars);

                  // Verificar se há um bar selecionado no localStorage
                  const selectedBarId = localStorage.getItem(
                    'sgb_selected_bar_id'
                  );
                  if (selectedBarId) {
                    const selectedBar = userData.availableBars.find(
                      (bar: Bar) => bar.id === parseInt(selectedBarId)
                    );
                    if (selectedBar) {
                      setSelectedBar(selectedBar);
                    } else {
                      setSelectedBar(userData.availableBars[0]);
                    }
                  } else {
                    setSelectedBar(userData.availableBars[0]);
                  }

                  setIsLoading(false);
                  return;
                }
              }
            } catch (e) {
              console.error(
                '❌ BarContext: Erro ao parsear dados do localStorage:',
                e
              );
            }
          }
        }

        // Se não há usuário, verificar localStorage como fallback
        const storedUser = localStorage.getItem('sgb_user');
        let userEmail = null;

        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            userEmail = userData.email;

            // Verificar se já temos os bares no localStorage
            if (
              userData.availableBars &&
              Array.isArray(userData.availableBars) &&
              userData.availableBars.length > 0
            ) {
              if (mounted) {
                setAvailableBars(userData.availableBars);

                // Verificar se há um bar selecionado no localStorage
                const selectedBarId = localStorage.getItem(
                  'sgb_selected_bar_id'
                );
                if (selectedBarId) {
                  const selectedBar = userData.availableBars.find(
                    (bar: Bar) => bar.id === parseInt(selectedBarId)
                  );
                  if (selectedBar) {
                    setSelectedBar(selectedBar);
                  } else {
                    setSelectedBar(userData.availableBars[0]);
                  }
                } else {
                  setSelectedBar(userData.availableBars[0]);
                }

                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error(
              '❌ BarContext: Erro ao parsear dados do usuário:',
              e
            );
          }
        }

        // Se não conseguiu do localStorage, tentar buscar da sessão do Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.email) {
          userEmail = session.user.email;
        }

        if (!userEmail) {
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('🔍 BarContext: Usando API para buscar bares...');

        try {
          const response = await fetch('/api/configuracoes/bars/user-bars', {
            headers: {
              'x-user-data': encodeURIComponent(JSON.stringify(user)),
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ BarContext: Dados recebidos da API:', data);

            if (data.bars && data.bars.length > 0) {
              if (mounted) {
                setAvailableBars(data.bars);

                // Verificar se há um bar selecionado no localStorage
                const selectedBarId = localStorage.getItem(
                  'sgb_selected_bar_id'
                );
                if (selectedBarId) {
                  const selectedBar = data.bars.find(
                    (bar: Bar) => bar.id === parseInt(selectedBarId)
                  );
                  if (selectedBar) {
                    setSelectedBar(selectedBar);
                    updateFavicon(selectedBar.nome);
                  } else {
                    const defaultBar = data.bars[0];
                    setSelectedBar(defaultBar);
                    updateFavicon(defaultBar.nome);
                  }
                } else {
                  const defaultBar = data.bars[0];
                  setSelectedBar(defaultBar);
                  updateFavicon(defaultBar.nome);
                }

                setIsLoading(false);
                return;
              }
            } else {
              console.log('❌ BarContext: Nenhum bar encontrado na API');
            }
          } else {
            console.error('❌ BarContext: Erro na API:', response.status);
          }
        } catch (error) {
          console.error('❌ BarContext: Erro ao chamar API:', error);
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao carregar bares do usuário:', error);
        if (mounted) setIsLoading(false);
      }
    }

    loadUserBars();

    return () => {
      mounted = false;
    };
  }, [user, userInitialized]);

  // Listener para mudanças no usuário
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserDataUpdated = () => {
      setIsLoading(true);
      // O useEffect principal vai recarregar com as novas dependências
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdated);

    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdated);
    };
  }, []);

  // Função para atualizar favicon baseado no bar
  const updateFavicon = (barName?: string) => {
    if (typeof window === 'undefined') return;

    const faviconPath = barName
      ? `/favicons/${barName.toLowerCase()}/favicon-32x32.png`
      : '/favicons/default/favicon-32x32.png';
    const appleTouchPath = barName
      ? `/favicons/${barName.toLowerCase()}/apple-touch-icon.png`
      : '/favicons/default/apple-touch-icon.png';

    // Atualizar favicon principal
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = faviconPath;

    // Atualizar favicon 32x32
    let favicon32 = document.querySelector(
      'link[rel="icon"][sizes="32x32"]'
    ) as HTMLLinkElement;
    if (!favicon32) {
      favicon32 = document.createElement('link');
      favicon32.rel = 'icon';
      favicon32.setAttribute('sizes', '32x32');
      favicon32.type = 'image/png';
      document.head.appendChild(favicon32);
    }
    favicon32.href = faviconPath;

    // Atualizar apple-touch-icon
    let appleIcon = document.querySelector(
      'link[rel="apple-touch-icon"]'
    ) as HTMLLinkElement;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = appleTouchPath;
  };

  // Função para alterar o bar selecionado
  const handleSetSelectedBar = (bar: Bar) => {
    setSelectedBar(bar);
    // Salvar no localStorage apenas se estamos no cliente
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgb_selected_bar_id', bar.id.toString());
      // Atualizar favicon baseado no bar selecionado
      updateFavicon(bar.nome);
    }
  };

  return (
    <BarContext.Provider
      value={{
        selectedBar,
        availableBars,
        setSelectedBar: handleSetSelectedBar,
        isLoading,
        resetBars,
      }}
    >
      {children}
    </BarContext.Provider>
  );
}

export function useBar() {
  const context = useContext(BarContext);
  if (context === undefined) {
    throw new Error('useBar must be used within a BarProvider');
  }
  return context;
}

// Alias para compatibilidade com código existente
export const useBarContext = useBar;
