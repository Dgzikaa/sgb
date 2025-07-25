import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useBar } from '@/contexts/BarContext';
import { api } from '@/lib/api-client';

interface ChecklistBadgeData {
  pendentes: number;
  atrasados: number;
  total: number;
}

export function useChecklistBadge() {
  const { user } = useUser();
  const { selectedBar } = useBar();
  const [badgeData, setBadgeData] = useState<ChecklistBadgeData>({
    pendentes: 0,
    atrasados: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchChecklistBadgeData = useCallback(async () => {
    if (!user || !selectedBar) return;

    try {
      setLoading(true);

      const response = await api.get(
        `/api/checklists/badge-data?bar_id=${selectedBar.id}&user_id=${user.id}`
      );

      if (response.success) {
        setBadgeData(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do badge de checklists:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedBar]);

  useEffect(() => {
    fetchChecklistBadgeData();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchChecklistBadgeData, 30000);

    return () => clearInterval(interval);
  }, [fetchChecklistBadgeData]);

  // Retornar o número total de itens pendentes + atrasados para o badge
  const badgeCount = badgeData.pendentes + badgeData.atrasados;

  return {
    badgeCount: badgeCount > 0 ? badgeCount : undefined,
    badgeData,
    loading,
    refresh: fetchChecklistBadgeData,
  };
}
