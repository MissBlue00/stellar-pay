import { Skeleton } from '@/app/components/ui/skeleton';

export default function WebhooksLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl"
          >
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <Skeleton className="h-11 w-36 rounded-lg" />
      </div>

      <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="py-4 px-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
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
