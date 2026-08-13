import { useEffect, useState, useCallback } from 'react'

interface StatusUpdate {
  type: string
  entity_type: string
  entity_id: string
  status: string
  timestamp: string
}

export function useStatusUpdates() {
  const [updates, setUpdates] = useState<StatusUpdate[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let eventSource: EventSource | null = null

    const connect = () => {
      console.log('Connecting to SSE...')
      eventSource = new EventSource('/api/status')

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        console.log('SSE message received:', event.data)
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            console.log('SSE connected successfully')
            return
          }

          if (data.type === 'status_update') {
            console.log('Status update received:', data)
            setUpdates((prev) => {
              // Remove old update for same entity if exists
              const filtered = prev.filter(
                (u) => !(u.entity_type === data.entity_type && u.entity_id === data.entity_id)
              )
              // Add new update at the beginning
              return [data, ...filtered].slice(0, 100) // Keep last 100 updates
            })
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error, event.data)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        setIsConnected(false)
        eventSource?.close()
        
        // Reconnect after 5 seconds
        setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      console.log('Closing SSE connection')
      eventSource?.close()
    }
  }, [])

  const getStatusForEntity = useCallback(
    (entityType: string, entityId: string) => {
      const status = updates.find(
        (u) => u.entity_type === entityType && u.entity_id === entityId
      )?.status
      console.log(`Getting status for ${entityType}:${entityId} = ${status}`)
      return status
    },
    [updates]
  )

  return {
    updates,
    isConnected,
    getStatusForEntity,
  }
}
