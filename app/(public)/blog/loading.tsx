import { Skeleton } from "@/components/ui/Skeleton";

/** Streams instantly while the blog index renders. */
export default function BlogLoading() {
  return (
    <main className="bg-white">
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-10 space-y-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </section>
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
