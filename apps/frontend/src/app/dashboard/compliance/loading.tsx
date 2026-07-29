import { Skeleton } from '@/app/components/ui/skeleton';

export default function ComplianceLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-36 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 bg-card border-border rounded-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card border-border rounded-xl">
          <Skeleton className="h-6 w-44 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-muted/30 border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-5 w-36 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-11 w-full mt-6 rounded-lg" />
        </div>

        <div className="p-6 bg-card border-border rounded-xl">
          <Skeleton className="h-6 w-44 mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pb-4 border-b border-border last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-green-400/10 border border-green-400/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1">
                <Skeleton className="h-5 w-36 mb-1" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
