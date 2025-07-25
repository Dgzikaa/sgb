import { TabsContent } from '@/components/ui/tabs';
import NiboIntegrationCard from '@/components/configuracoes/NiboIntegrationCard';

interface NiboSectionProps {
  selectedBar: unknown;
}

export function NiboSection({ selectedBar }: NiboSectionProps) {
  return (
    <TabsContent value="nibo" className="space-y-6">
      <NiboIntegrationCard selectedBar={selectedBar} />
    </TabsContent>
  );
}
