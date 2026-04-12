'use client'

import { useState, useEffect, useCallback } from 'react'
import { JobStatus } from '@/types/analysis'

interface UseJobStatusOptions {
  jobId: string | null
  pollInterval?: number
  onComplete?: (result: JobStatus) => void
  onError?: (error: string) => void
}

export function useJobStatus({
  jobId,
  pollInterval = 2000,
  onComplete,
  onError,
}: UseJobStatusOptions) {
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!jobId) return

    try {
      const response = await fetch(`/api/jobs/status?jobId=${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job status')
      }

      const data: JobStatus = await response.json()
      setStatus(data)

      if (data.status === 'completed') {
        setIsPolling(false)
        onComplete?.(data)
      } else if (data.status === 'failed') {
        setIsPolling(false)
        onError?.(data.error || 'Job failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      onError?.(errorMessage)
      setIsPolling(false)
    }
  }, [jobId, onComplete, onError])

  useEffect(() => {
    if (!jobId) {
      setStatus(null)
      setIsPolling(false)
      return
    }

    setIsPolling(true)
    fetchStatus()

    const interval = setInterval(fetchStatus, pollInterval)

    return () => {
      clearInterval(interval)
    }
  }, [jobId, pollInterval, fetchStatus])

  return {
    status,
    isPolling,
    refetch: fetchStatus,
  }
}
