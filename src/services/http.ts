/**
 * TerraMind-X Secure HTTP Client Utility
 * Provides timeout protection, AbortController support, and structured error handling.
 */

export interface FetchOptions extends RequestInit {
  timeoutMs?: number
}

export class HttpTimeoutError extends Error {
  constructor(message: string = 'Network request timed out') {
    super(message)
    this.name = 'HttpTimeoutError'
  }
}

export class HttpError extends Error {
  status: number
  statusText: string
  data?: any

  constructor(status: number, statusText: string, data?: any) {
    super(`HTTP ${status}: ${statusText}`)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

/**
 * Executes a fetch request with timeout protection and cancellation support.
 */
export async function fetchWithTimeout<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeoutMs = 12000, signal, ...fetchOptions } = options

  const controller = new AbortController()
  let isTimedOut = false

  // Set timeout timer
  const timeoutId = setTimeout(() => {
    isTimedOut = true
    controller.abort()
  }, timeoutMs)

  // Combine with external abort signal if provided
  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorBody: any = null
      try {
        errorBody = await response.json()
      } catch {
        try {
          errorBody = await response.text()
        } catch {}
      }
      throw new HttpError(response.status, response.statusText, errorBody)
    }

    // Parse JSON with protection
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    const text = await response.text()
    try {
      return JSON.parse(text) as T
    } catch {
      return text as unknown as T
    }
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (isTimedOut) {
      throw new HttpTimeoutError(`Request to ${url} exceeded timeout limit of ${timeoutMs}ms`)
    }
    if (error.name === 'AbortError') {
      throw error // Re-throw cancellation for component to handle
    }
    throw error
  }
}
