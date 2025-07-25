import {
  SkeletonCard,
  SkeletonTable,
  SkeletonStats,
  SkeletonChart,
  SkeletonPageHeader,
  SkeletonList,
  SkeletonForm,
} from '@/components/ui/skeleton';

// =====================================================
// DASHBOARD SKELETONS
// =====================================================

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <SkeletonPageHeader />
        <SkeletonStats items={4} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonTable rows={6} columns={5} />
          </div>
          <SkeletonList items={5} />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CHECKLIST SKELETONS
// =====================================================

export function ChecklistSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <SkeletonPageHeader />

        {/* Filtros e controles */}
        <div className="card-dark p-4">
          <div className="animate-pulse">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
            </div>
          </div>
        </div>

        {/* Lista de checklists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-dark p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// RELATORIOS SKELETONS
// =====================================================

export function RelatorioSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <SkeletonPageHeader />

        {/* Filtros de data */}
        <div className="card-dark p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="flex items-end">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
            </div>
          </div>
        </div>

        <SkeletonStats items={3} />
        <SkeletonChart />
        <SkeletonTable rows={8} columns={6} />
      </div>
    </div>
  );
}

// =====================================================
// CONFIGURAÇÕES SKELETONS
// =====================================================

export function ConfiguracoesSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <SkeletonPageHeader />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonForm fields={8} />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonList items={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// OPERAÇÕES SKELETONS
// =====================================================

export function OperacoesSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <SkeletonPageHeader />

        {/* Cards de operações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-dark p-6">
              <div className="animate-pulse space-y-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonTable rows={5} columns={4} />
          <SkeletonChart />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// VISÃO GERAL SKELETONS
// =====================================================

export function VisaoGeralSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header especial para visão geral */}
        <div className="card-dark p-8">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-80"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
              </div>
              <div className="flex space-x-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <SkeletonStats items={4} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonList items={6} />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MARKETING 360 SKELETON
// =====================================================

export function Marketing360Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header especial com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-purple-700 to-blue-800 dark:from-pink-700 dark:via-purple-800 dark:to-blue-900">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative px-8 py-12">
            <div className="text-center text-white space-y-6">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                  <div className="w-6 h-6 bg-white/60 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce delay-150">
                  <div className="w-6 h-6 bg-white/60 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce delay-300">
                  <div className="w-6 h-6 bg-white/60 rounded"></div>
                </div>
              </div>
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-white/20 rounded mx-auto w-64"></div>
                <div className="h-6 bg-white/20 rounded mx-auto w-80"></div>
                <div className="w-64 mx-auto">
                  <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full animate-pulse"
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SkeletonStats items={4} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// FUNCIONÁRIO SKELETON
// =====================================================

export function FuncionarioSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header mobile-friendly */}
        <div className="card-dark p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de checklist mobile */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-dark p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// LOADING FULLSCREEN COMPONENT
// =====================================================

export function FullScreenSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-64"></div>
        </div>
      </div>
    </div>
  );
}
