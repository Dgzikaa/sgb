'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import ModernAgentChat from '@/components/ModernAgentChat';

export default function AgentePage() {
  return (
    <ProtectedRoute>
      <ModernAgentChat />
    </ProtectedRoute>
  );
}