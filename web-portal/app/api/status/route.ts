import { NextRequest } from 'next/server'
import { createClient } from 'redis'
import { upstashCommand } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isCloud = process.env.INFRASTRUCTURE_MODE === 'CLOUD'
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const redisClient = createClient({ url: redisUrl })

  try {
    if (!isCloud) {
      await redisClient.connect()
      console.log('Redis connected for SSE')
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false
        const closeController = () => {
          if (!isClosed) {
            isClosed = true
            controller.close()
          }
        }

        try {
          // Send initial connection message
          if (!isClosed) {
            controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
            console.log('SSE: Sent connected message')
          }

          // Keep connection alive with heartbeat
          const heartbeat = setInterval(() => {
            if (!isClosed) {
              try {
                controller.enqueue(encoder.encode(': heartbeat\n\n'))
              } catch (e) {
                // Controller already closed, stop heartbeat
                clearInterval(heartbeat)
              }
            }
          }, 30000)

          // Poll for status updates using brpop (similar to embedding jobs)
          const pollQueue = async () => {
            console.log('SSE: Starting to poll queue')
            while (!req.signal.aborted && !isClosed) {
              try {
                // brpop with 5 second timeout
                const result = isCloud
                  ? await upstashCommand<[string, string] | null>('BRPOP', 'status_updates_queue', '5')
                  : await redisClient.brPop('status_updates_queue', 5)
                
                if (result && !isClosed) {
                  const message = Array.isArray(result) ? result[1] : result.element
                  console.log('SSE: Received from queue:', message)
                  const data = `data: ${message}\n\n`
                  try {
                    controller.enqueue(encoder.encode(data))
                  } catch (e) {
                    // Controller already closed, stop polling
                    break
                  }
                } else {
                  console.log('SSE: No message in queue (timeout)')
                }
              } catch (error) {
                if (req.signal.aborted || isClosed) break
                console.error('SSE: brpop error:', error)
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }
          }

          pollQueue()

          // Cleanup on close
          const abortHandler = async () => {
            console.log('SSE: Connection aborted')
            clearInterval(heartbeat)
            closeController()
            try {
              if (!isCloud) await redisClient.quit()
            } catch (e) {
              // Ignore quit errors
            }
          }
          
          req.signal.addEventListener('abort', abortHandler)
        } catch (error) {
          console.error('SSE error:', error)
          closeController()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Redis connection error:', error)
    return new Response('Failed to connect to Redis', { status: 500 })
  }
}
