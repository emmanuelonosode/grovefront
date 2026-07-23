import { Skeleton, PropertyGridSkeleton } from "@/components/ui/Skeleton";

/** Streams instantly while the apartments landing page renders. */
export default function ApartmentsLoading() {
  return (
    <div className="bg-white">
      <section className="bg-brand-light border-b border-brand-muted">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-12 space-y-4">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-10 w-3/5 max-w-xl" />
          <Skeleton className="h-4 w-72" />
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <PropertyGridSkeleton count={6} />
      </section>
    </div>
  );
}
