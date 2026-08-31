import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl transition-all hover:shadow-md p-6 flex flex-col space-y-4 rounded-xl border border-border/50">
      <Skeleton className="h-6 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-5/6 rounded-md" />
      <div className="pt-4 flex justify-between items-center">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rowCount = 5, colCount = 4 }: { rowCount?: number, colCount?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4">
        {Array.from({ length: colCount }).map((_, i) => (
          <div key={`header-${i}`} className="flex-1">
            <Skeleton className="h-4 w-2/3 bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-6 py-4 flex gap-4 items-center">
            {Array.from({ length: colCount }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1">
                <Skeleton className={`h-4 bg-slate-100 ${colIndex === 0 ? 'w-3/4' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
