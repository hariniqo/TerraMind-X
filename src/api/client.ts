/**
 * TerraMind-X Central API Client
 * Enterprise HTTP Client with timeout, retry, abort controller, auth header injection,
 * unified error normalization, and SIH Demo Mode toggle.
 */

export interface ApiResponse<T = any> {
  data: T
  status: number
  ok: boolean
  message?: string
  error?: string
  source?: string
  timestamp: string
}

export interface ApiError {
  statusCode: number
  message: string
  detail?: any
  isNetworkError: boolean
  isTimeout: boolean
}

// Backend base URL resolution from env
const ENV_URL = (import.meta as any).env?.VITE_API_BASE_URL
export const API_BASE_URL =
  ENV_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes('http')
    ? window.location.origin
    : 'http://localhost:8000')

// Demo Mode state
let demoModeActive = false

export function setDemoMode(active: boolean) {
  demoModeActive = active
  if (typeof window !== 'undefined') {
    localStorage.setItem('terramind_demo_mode', active ? 'true' : 'false')
    window.dispatchEvent(new CustomEvent('terramind_demo_mode_changed', { detail: { active } }))
  }
}

export function isDemoMode(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('terramind_demo_mode')
    if (saved !== null) {
      demoModeActive = saved === 'true'
    }
  }
  return demoModeActive
}

// Session Token Storage
const TOKEN_KEY = 'terramind_auth_token'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
  skipAuth?: boolean
}

/**
 * Standardized HTTP Request Method
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 15000,
    retries = 1,
    skipAuth = false,
    headers: customHeaders,
    ...fetchOpts
  } = options

  // Normalize path with /api/v1 prefix if not absolute
  let fullUrl = endpoint
  if (!endpoint.startsWith('http')) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    if (!cleanEndpoint.startsWith('/api/v1') && !cleanEndpoint.startsWith('/health')) {
      fullUrl = `${API_BASE_URL}/api/v1${cleanEndpoint}`
    } else {
      fullUrl = `${API_BASE_URL}${cleanEndpoint}`
    }
  }

  const token = !skipAuth ? getAuthToken() : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let attempt = 0
  let lastError: any = null

  while (attempt <= retries) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(fullUrl, {
        ...fetchOpts,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch {
          // non-JSON body
        }

        const apiError: ApiError = {
          statusCode: response.status,
          message:
            errorData?.detail ||
            errorData?.message ||
            `HTTP ${response.status}: Request failed for ${endpoint}`,
          detail: errorData,
          isNetworkError: false,
          isTimeout: false,
        }

        // Token expired / Unauthorized
        if (response.status === 401) {
          setAuthToken(null)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('terramind_auth_unauthorized'))
          }
        }

        throw apiError
      }

      // Check if response has content
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        return json as T
      }

      return (await response.text()) as unknown as T
    } catch (err: any) {
      clearTimeout(timer)
      lastError = err

      if (err.name === 'AbortError') {
        lastError = {
          statusCode: 408,
          message: `Request timeout after ${timeoutMs / 1000}s for ${endpoint}`,
          isNetworkError: false,
          isTimeout: true,
        }
      } else if (!err.statusCode) {
        lastError = {
          statusCode: 0,
          message: `Unable to connect to TerraMind-X server at ${API_BASE_URL}. Check network connection.`,
          isNetworkError: true,
          isTimeout: false,
        }
      }

      // Only retry on network errors or 503/504
      if (
        attempt < retries &&
        (lastError.isNetworkError || lastError.statusCode === 503 || lastError.statusCode === 504)
      ) {
        attempt++
        await new Promise((res) => setTimeout(res, 800 * attempt))
        continue
      }

      break
    }
  }

  throw lastError
}
