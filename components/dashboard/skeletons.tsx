export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Cargando estadísticas">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
          <div className="w-9 h-9 bg-muted rounded-lg mb-3" />
          <div className="h-7 w-16 bg-muted rounded mb-1.5" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function RecentSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl animate-pulse" aria-busy="true" aria-label="Cargando pacientes">
      <div className="px-5 py-4 border-b border-border">
        <div className="h-4 w-36 bg-muted rounded" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0">
          <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse" aria-busy="true">
      <div className="px-5 py-3.5 border-b border-border flex gap-4">
        {[3, 5, 4, 3].map((w, i) => (
          <div key={i} className={`h-3.5 w-${w * 8} bg-muted rounded`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
          <div className="w-8 h-8 bg-muted rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 bg-muted rounded" />
            <div className="h-3 w-56 bg-muted rounded" />
          </div>
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-7 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
