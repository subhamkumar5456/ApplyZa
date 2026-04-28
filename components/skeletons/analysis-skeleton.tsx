import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AnalysisSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ATS Score Card Skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <div className="h-6 w-32 bg-muted rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="h-32 w-32 rounded-full bg-muted"></div>
            </div>
            <div className="space-y-3 mt-6">
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-24 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-5/6 bg-muted rounded"></div>
            </div>
            <div>
              <div className="h-5 w-24 bg-muted rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-4/5 bg-muted rounded"></div>
              </div>
            </div>
            <div>
              <div className="h-5 w-32 bg-muted rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-4/5 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
