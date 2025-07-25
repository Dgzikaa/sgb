'use client';

import { useState, useEffect } from 'react';

interface AssistantState {
  isOpen: boolean;
  hasNewMessages: boolean;
  lastInteraction: Date | null;
}

export function useSGBAssistant() {
  const [state, setState] = useState<AssistantState>({
    isOpen: false,
    hasNewMessages: false,
    lastInteraction: null,
  });

  // Carregar estado persistido do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sgb-assistant-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          ...parsed,
          lastInteraction: parsed.lastInteraction
            ? new Date(parsed.lastInteraction)
            : null,
        }));
      }
    } catch (error) {
      console.warn('Erro ao carregar estado do assistant:', error);
    }
  }, []);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem('sgb-assistant-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Erro ao salvar estado do assistant:', error);
    }
  }, [state]);

  const toggleAssistant = () => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      hasNewMessages: prev.isOpen ? false : prev.hasNewMessages, // Limpar notificação ao abrir
      lastInteraction: new Date(),
    }));
  };

  const markAsRead = () => {
    setState(prev => ({
      ...prev,
      hasNewMessages: false,
    }));
  };

  const addNotification = () => {
    setState(prev => ({
      ...prev,
      hasNewMessages: !prev.isOpen, // Só mostrar notificação se estiver fechado
    }));
  };

  return {
    isOpen: state.isOpen,
    hasNewMessages: state.hasNewMessages,
    lastInteraction: state.lastInteraction,
    toggleAssistant,
    markAsRead,
    addNotification,
  };
}
