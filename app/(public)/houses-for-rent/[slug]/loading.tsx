import { Skeleton } from "@/components/ui/Skeleton";

/** Streams instantly while a property detail page renders on the server. */
export default function PropertyLoading() {
  return (
    <main className="bg-neutral-50/30">
      <div className="pt-24 bg-white">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-14" />
        </div>

        {/* Photo gallery */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Skeleton className="w-full h-[320px] sm:h-[420px] rounded-xl" />
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 border-b border-neutral-100 flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-28 rounded" />
        </div>

        {/* Price band + CTA card */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-neutral-100">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-6 w-4/5 max-w-xl" />
            <Skeleton className="h-16 w-full max-w-2xl rounded" />
          </div>
          <div className="shrink-0 w-full md:w-[280px] space-y-2 bg-neutral-50 border border-neutral-200/80 rounded-xl p-4">
            <Skeleton className="h-11 w-full rounded" />
            <Skeleton className="h-11 w-full rounded" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 lg:gap-10">
        <div className="flex-1 min-w-0 bg-white border border-neutral-200/80 rounded-xl p-6 md:p-8 space-y-6">
          <Skeleton className="h-7 w-44" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-7 w-52" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="w-full lg:w-[340px] shrink-0">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
