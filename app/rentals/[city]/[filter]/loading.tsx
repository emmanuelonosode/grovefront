import { Skeleton, PropertyGridSkeleton } from "@/components/ui/Skeleton";

/** Streams instantly while a city filter page (e.g. 3-bedroom) renders. */
export default function CityFilterLoading() {
  return (
    <main className="bg-white">
      <section className="bg-brand-light border-b border-brand-muted">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-12 space-y-4">
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-10 w-3/5 max-w-xl" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <PropertyGridSkeleton count={6} />
      </section>
    </main>
  );
}
