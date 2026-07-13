import { Skeleton, PropertyGridSkeleton } from "@/components/ui/Skeleton";

/** Streams instantly while a city/state landing page renders on the server. */
export default function CityLoading() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[520px] lg:min-h-[560px] flex items-end bg-neutral-200/60 animate-pulse">
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-12 pt-32">
          <div className="max-w-2xl bg-white rounded-2xl shadow-2xl p-8 lg:p-12 space-y-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-12 w-48 rounded-md" />
              <Skeleton className="h-12 w-44 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Market stats */}
      <section className="bg-brand-light border-b border-brand-muted">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-neutral-100 rounded-sm p-5 flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-sm shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Property grid */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <Skeleton className="h-3 w-28 mb-3" />
          <Skeleton className="h-9 w-72 mb-10" />
          <PropertyGridSkeleton count={6} />
        </div>
      </section>
    </>
  );
}
