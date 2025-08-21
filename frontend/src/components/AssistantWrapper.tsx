'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AssistantButton from './AssistantButton';
import SGBAssistant from './SGBAssistant';

export default function AssistantWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessages(false);
    }
  };

  // Não mostrar assistant na página inicial ou se usuário não estiver logado
  if (pathname === '/' || !user) {
    return null;
  }

  return (
    <>
      <AssistantButton
        onClick={handleToggle}
        isOpen={isOpen}
        hasNewMessages={hasNewMessages}
      />
      <SGBAssistant
        isOpen={isOpen}
        onToggle={handleToggle}
        barInfo={{ nome: 'Ordinário Bar', id: 3 }}
      />
    </>
  );
}
