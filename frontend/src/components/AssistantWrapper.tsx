'use client';

import { useState } from 'react';
import AssistantButton from './AssistantButton';
import SGBAssistant from './SGBAssistant';

export default function AssistantWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessages(false);
    }
  };

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
