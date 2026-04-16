'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { JobStatus } from '@/types/analysis'

interface UseJobStatusOptions {
  jobId: string | null
  pollInterval?: number
  onComplete?: (result: JobStatus) => void
  onError?: (error: string) => void
}

export function useJobStatus({
  jobId,
  pollInterval = 3000,
  onComplete,
  onError,
}: UseJobStatusOptions) {
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Store callbacks in refs so they don't trigger effect re-runs
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)
  onCompleteRef.current = onComplete
  onErrorRef.current = onError

  // Track whether the job has already been finalized to prevent double-calls
  const finalizedRef = useRef(false)

  useEffect(() => {
    if (!jobId) {
      setStatus(null)
      setIsPolling(false)
      finalizedRef.current = false
      return
    }

    let cancelled = false
    finalizedRef.current = false
    setIsPolling(true)

    const poll = async () => {
      if (cancelled || finalizedRef.current) return

      try {
        const response = await fetch(`/api/jobs/status?jobId=${jobId}`)
        if (cancelled || finalizedRef.current) return

        if (!response.ok) {
          console.warn('[useJobStatus] Status fetch returned', response.status)
          // Don't stop polling on transient server errors — retry on next tick
          return
        }

        const data: JobStatus = await response.json()
        if (cancelled || finalizedRef.current) return

        setStatus(data)

        if (data.status === 'completed') {
          finalizedRef.current = true
          setIsPolling(false)
          onCompleteRef.current?.(data)
        } else if (data.status === 'failed') {
          finalizedRef.current = true
          setIsPolling(false)
          onErrorRef.current?.(data.error || 'Job failed')
        }
      } catch (err) {
        if (cancelled || finalizedRef.current) return
        console.warn('[useJobStatus] Poll error, will retry:', err)
        // Don't kill polling on transient fetch errors — allow retries
      }
    }

    // Initial fetch after a short delay to give the server time to start processing
    const initialTimeout = setTimeout(poll, 1000)
    const interval = setInterval(poll, pollInterval)

    return () => {
      cancelled = true
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [jobId, pollInterval])

  const refetch = useCallback(async () => {
    if (!jobId) return
    try {
      const response = await fetch(`/api/jobs/status?jobId=${jobId}`)
      if (response.ok) {
        const data: JobStatus = await response.json()
        setStatus(data)
      }
    } catch {
      // silent
    }
  }, [jobId])

  return {
    status,
    isPolling,
    refetch,
  }
}
