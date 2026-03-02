export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 md:gap-10 animate-pulse">
      {/* Header skeleton */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="h-10 w-72 bg-muted rounded-lg mb-2" />
          <div className="h-5 w-48 bg-muted/60 rounded" />
        </div>
      </header>

      {/* KPI row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[1.5rem] bg-card p-5 shadow-sm">
            <div className="h-3 w-20 bg-muted rounded mb-3" />
            <div className="h-7 w-12 bg-muted/80 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10">
        <div className="space-y-6">
          <div className="h-48 bg-card rounded-[2rem] border border-border/50" />
          <div className="h-32 bg-card rounded-[1.5rem] border border-border/50" />
        </div>
        <div className="space-y-6">
          <div className="h-40 bg-card rounded-[2rem] border border-border/50" />
          <div className="h-64 bg-card rounded-[2.5rem] border border-border/50" />
        </div>
      </div>
    </div>
  );
}
