import { Skeleton, SkeletonCard } from "@/components/ui/primitives";

/** Route-level fallback shown while an (app) page/segment resolves. */
export default function Loading() {
  return (
    <div>
      {/* header */}
      <div className="flex items-start justify-between border-b border-border px-7 pt-6 pb-5">
        <div className="space-y-2">
          <Skeleton w={200} h={26} />
          <Skeleton w={280} h={13} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton w={190} h={44} rounded="rounded-lg" />
          <Skeleton w={150} h={44} rounded="rounded-lg" />
          <Skeleton w={110} h={44} rounded="rounded-lg" />
        </div>
      </div>
      {/* body */}
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
        <SkeletonCard chart />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      </div>
    </div>
  );
}
