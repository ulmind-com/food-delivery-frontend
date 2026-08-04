const SkeletonCard = () => (
  <div className="flex flex-col rounded-[22px] border border-border/70 bg-card p-2.5 shadow-float">
    <div className="shimmer aspect-[5/4] w-full rounded-[16px]" />
    <div className="flex flex-col gap-2 px-1.5 pb-1 pt-3">
      <div className="shimmer h-2.5 w-14 rounded" />
      <div className="shimmer h-4 w-3/4 rounded" />
      <div className="shimmer h-2.5 w-full rounded" />
      <div className="shimmer mt-1 h-5 w-20 rounded" />
      <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2.5">
        <div className="shimmer h-3 w-20 rounded" />
        <div className="shimmer h-9 w-9 rounded-full" />
      </div>
    </div>
  </div>
);

const SkeletonCategory = () => (
  <div className="flex flex-shrink-0 flex-col items-center gap-3">
    <div className="shimmer h-[74px] w-[74px] rounded-full sm:h-[86px] sm:w-[86px]" />
    <div className="shimmer h-3 w-14 rounded" />
  </div>
);

export { SkeletonCard, SkeletonCategory };
