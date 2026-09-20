import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-pulse bg-zinc-100 rounded-lg ${className}`}
      {...props}
    />
  );
};

export const ResultsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-[1120px] mx-auto opacity-75">
      {/* Left Column Skeleton */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-center">
            <Skeleton className="w-36 h-36 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-1/2 mx-auto" />
          <div className="pt-4 border-t border-zinc-100 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </div>

      {/* Right Column Skeleton */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-md" />
            ))}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-zinc-100 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
