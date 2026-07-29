import { Skeleton } from '@/app/components/ui/skeleton';

export default function AuditLogsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-36 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 bg-card border-border rounded-xl"
          >
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex-1" />
        <Skeleton className="h-11 w-24 rounded-lg" />
        <Skeleton className="h-11 w-24 rounded-lg" />
      </div>

      <div className="bg-card border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-muted/20">
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="py-4 px-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
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
