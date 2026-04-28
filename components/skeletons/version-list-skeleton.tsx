export function VersionListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="h-10 w-10 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-muted rounded"></div>
            <div className="h-3 w-1/4 bg-muted rounded"></div>
          </div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  )
}
