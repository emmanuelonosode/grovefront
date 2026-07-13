/**
 * Skeleton loading primitives — used by the route-level `loading.tsx` files so
 * navigation paints instantly while the server renders. Keep these purely
 * presentational (no data, no client hooks) so the loading shell streams first.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-neutral-200/70 ${className}`}
    />
  );
}

/** Matches PropertyCard's default (vertical) variant. */
export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-3">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}

/** Matches PropertyCard's horizontal variant (search results list). */
export function PropertyCardSkeletonHorizontal() {
  return (
    <div className="flex bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <Skeleton className="w-36 sm:w-52 shrink-0 min-h-[124px] rounded-none" />
      <div className="p-4 flex-1 space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-3">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
