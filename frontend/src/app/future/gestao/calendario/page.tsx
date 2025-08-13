"use client";

import PageHeader from '@/components/layouts/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function CalendarioPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <PageHeader title="Calendário de Eventos" />
        <Card className="card-dark">
          <CardContent className="p-6">
            Em breve: calendário visual
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
