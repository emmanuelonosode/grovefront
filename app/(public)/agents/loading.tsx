import { Skeleton } from "@/components/ui/Skeleton";

/** Streams instantly while the agents directory renders. */
export default function AgentsLoading() {
  return (
    <main className="bg-white">
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-10 space-y-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-64" />
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-neutral-200 rounded-2xl p-6 flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
