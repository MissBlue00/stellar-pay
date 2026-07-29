import { Skeleton } from '@/app/components/ui/skeleton';

export default function ApiKeysLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-28 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="mb-8 p-6 bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1">
            <Skeleton className="h-5 w-44 mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Skeleton className="h-11 w-44 rounded-lg" />
      </div>

      <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl overflow-hidden">
        <div className="space-y-4 p-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-lg">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-5 w-20 rounded" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-10 flex-1 rounded" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
