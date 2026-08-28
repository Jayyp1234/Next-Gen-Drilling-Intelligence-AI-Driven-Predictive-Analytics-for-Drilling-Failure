import { Skeleton, SkeletonCard } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div>
      <div className="flex items-start justify-between border-b border-border px-7 pt-6 pb-5">
        <div className="space-y-2"><Skeleton w={200} h={26} /><Skeleton w={320} h={13} /></div>
        <div className="flex gap-3"><Skeleton w={150} h={44} rounded="rounded-lg" /><Skeleton w={190} h={44} rounded="rounded-lg" /></div>
      </div>
      <div className="border-b border-border px-7 py-5"><Skeleton h={30} className="w-full" /></div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(240px,320px)] gap-4 p-5">
        <SkeletonCard chart /><SkeletonCard lines={6} />
      </div>
    </div>
  );
}
