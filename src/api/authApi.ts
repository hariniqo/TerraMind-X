/**
 * TerraMind-X Authentication API Client
 */

import { apiRequest, setAuthToken } from './client'

export interface UserProfile {
  id: string
  name: string
  phone?: string
  email?: string
  role: string
  state: string
  district: string
  taluka?: string
  village?: string
  preferred_language: string
  registered_at?: string
  last_login?: string
}

export interface RegisterPayload {
  name: string
  phone?: string
  email?: string
  password?: string
  role?: string
  state?: string
  district?: string
  taluka?: string
  village?: string
  preferred_language?: string
}

export interface LoginPayload {
  phone_or_email: string
  password: string
}

export interface AuthResult {
  token: string
  token_type: string
  user: UserProfile
  message: string
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResult> {
  const res = await apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  })
  if (res.token) {
    setAuthToken(res.token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('terramind_user', JSON.stringify(res.user))
    }
  }
  return res
}

export async function loginUser(payload: LoginPayload): Promise<AuthResult> {
  const res = await apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  })
  if (res.token) {
    setAuthToken(res.token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('terramind_user', JSON.stringify(res.user))
    }
  }
  return res
}

export async function logoutUser(): Promise<{ status: string; message: string }> {
  try {
    const res = await apiRequest<{ status: string; message: string }>('/auth/logout', {
      method: 'POST',
    })
    return res
  } finally {
    setAuthToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('terramind_user')
    }
  }
}

export async function getCurrentUser(): Promise<UserProfile> {
  const user = await apiRequest<UserProfile>('/auth/me', {
    method: 'GET',
  })
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem('terramind_user', JSON.stringify(user))
  }
  return user
}
