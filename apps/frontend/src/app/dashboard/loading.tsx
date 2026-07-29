import { Skeleton } from '@/app/components/ui/skeleton';

export default function OverviewLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 bg-card border-border rounded-xl"
          >
            <Skeleton className="h-10 w-10 rounded-lg mb-4" />
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-6 bg-card border-border rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 bg-muted/30 border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </div>
                </div>
                <Skeleton className="h-1 w-full mt-3 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-card border-border rounded-xl">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="flex items-center justify-center mb-6">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 bg-card border-border rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-2 w-2 rounded-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {Array.from({ length: 7 }).map((_, i) => (
                  <th key={i} className="py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
