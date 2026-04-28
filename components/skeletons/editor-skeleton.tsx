export function EditorSkeleton() {
  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 animate-pulse">
      {/* Editor Side */}
      <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
        <div className="h-12 border-b bg-muted/50 flex items-center px-4 gap-2">
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="h-6 w-6 bg-muted rounded ml-auto"></div>
          <div className="h-6 w-6 bg-muted rounded"></div>
          <div className="h-6 w-20 bg-muted rounded"></div>
        </div>
        <div className="flex-1 p-4 bg-muted/20">
          <div className="space-y-3">
            {[...Array(15)].map((_, i) => (
              <div 
                key={i} 
                className="h-4 bg-muted rounded" 
                style={{ width: `${Math.max(40, Math.random() * 90)}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Preview Side */}
      <div className="flex-1 hidden md:flex flex-col border rounded-lg overflow-hidden">
        <div className="h-12 border-b bg-muted/50 flex items-center px-4">
          <div className="h-4 w-32 bg-muted rounded"></div>
          <div className="h-6 w-8 bg-muted rounded ml-auto"></div>
        </div>
        <div className="flex-1 bg-muted/30 p-8 flex justify-center">
          <div className="w-full max-w-[500px] h-full bg-white shadow-sm border rounded"></div>
        </div>
      </div>
    </div>
  )
}
