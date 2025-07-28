import { TabsContent } from '@/components/ui/tabs';
import NiboIntegrationCard from '@/components/configuracoes/NiboIntegrationCard';

interface Bar {
  id: number;
  nome: string;
}

interface NiboSectionProps {
  selectedBar: Bar | null;
}

export function NiboSection({ selectedBar }: NiboSectionProps) {
  return (
    <TabsContent value="nibo" className="space-y-6">
      <NiboIntegrationCard selectedBar={selectedBar} />
    </TabsContent>
  );
}
