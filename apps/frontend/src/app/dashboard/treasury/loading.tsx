import { Skeleton } from '@/app/components/ui/skeleton';

export default function TreasuryLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl"
          >
            <Skeleton className="h-10 w-10 rounded-lg mb-4" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="mb-8 p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl">
        <Skeleton className="h-6 w-36 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-lg">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Skeleton className="h-12 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-28 mb-1" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-28 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl">
          <Skeleton className="h-6 w-44 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl">
          <Skeleton className="h-6 w-44 mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="text-right mt-1">
                  <Skeleton className="h-3 w-8 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
