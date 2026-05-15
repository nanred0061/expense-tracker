import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface AuthResponse {
  access_token: string
  token_type:   string
  user_id:      number
  name:         string
}

export interface User {
  id:         number
  name:       string
  email:      string
  created_at: string
}

// Store token in localStorage
export const saveToken = (token: string, name: string, userId: number) => {
  localStorage.setItem('token',   token)
  localStorage.setItem('name',    name)
  localStorage.setItem('user_id', String(userId))
}

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

// Get user name from localStorage
export const getUserName = (): string | null => {
  return localStorage.getItem('name')
}

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('token')
}

// Clear token on logout
export const clearToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('name')
  localStorage.removeItem('user_id')
}

// Sign up
export const signup = async (
  name:     string,
  email:    string,
  password: string
): Promise<AuthResponse> => {
  const res = await axios.post(`${BASE_URL}/auth/signup`, {
    name, email, password
  })
  return res.data
}

// Login
export const login = async (
  email:    string,
  password: string
): Promise<AuthResponse> => {
  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email, password
  })
  return res.data
}

// Get current user
export const getMe = async (): Promise<User> => {
  const res = await axios.get(`${BASE_URL}/auth/me`)
  return res.data
}
