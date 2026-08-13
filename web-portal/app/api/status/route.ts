import { NextRequest } from 'next/server'
import { createClient } from 'redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const redisClient = createClient({ url: redisUrl })

  try {
    await redisClient.connect()
    console.log('Redis connected for SSE')

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection message
          controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
          console.log('SSE: Sent connected message')

          // Keep connection alive with heartbeat
          const heartbeat = setInterval(() => {
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
          }, 30000)

          // Poll for status updates using brpop (similar to embedding jobs)
          const pollQueue = async () => {
            console.log('SSE: Starting to poll queue')
            while (!req.signal.aborted) {
              try {
                // brpop with 5 second timeout
                const result = await redisClient.brPop('status_updates_queue', 5)
                
                if (result) {
                  const message = result.element
                  console.log('SSE: Received from queue:', message)
                  const data = `data: ${message}\n\n`
                  controller.enqueue(encoder.encode(data))
                } else {
                  console.log('SSE: No message in queue (timeout)')
                }
              } catch (error) {
                if (req.signal.aborted) break
                console.error('SSE: brpop error:', error)
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }
          }

          pollQueue()

          // Cleanup on close
          req.signal.addEventListener('abort', async () => {
            console.log('SSE: Connection aborted')
            clearInterval(heartbeat)
            await redisClient.quit()
            controller.close()
          })
        } catch (error) {
          console.error('SSE error:', error)
          controller.close()
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
