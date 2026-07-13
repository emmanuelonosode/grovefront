import { Skeleton, PropertyCardSkeletonHorizontal } from "@/components/ui/Skeleton";

/** Streams instantly while the search page renders (list + map split view). */
export default function HousesForRentLoading() {
  return (
    <main>
      {/* Filter bar */}
      <div className="border-b border-neutral-100 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-3 flex items-center gap-2 overflow-hidden">
          <Skeleton className="h-10 w-64 rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg hidden sm:block" />
          ))}
        </div>
      </div>

      {/* List + map split */}
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-5 flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <Skeleton className="h-4 w-56" />
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeletonHorizontal key={i} />
          ))}
        </div>
        <div className="hidden lg:block w-[45%] shrink-0">
          <Skeleton className="h-[calc(100vh-140px)] w-full rounded-2xl sticky top-24" />
        </div>
      </div>
    </main>
  );
}
