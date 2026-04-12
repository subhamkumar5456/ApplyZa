import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  uploaded: { label: 'Uploaded', variant: 'secondary' },
  parsing: { label: 'Parsing...', variant: 'warning' },
  parsed: { label: 'Ready', variant: 'success' },
  pending: { label: 'Pending', variant: 'secondary' },
  processing: { label: 'Processing...', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const }

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}
