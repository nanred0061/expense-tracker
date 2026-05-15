import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── TYPES ────────────────────────────────────────────
export interface UserProfile {
  id: number
  is_earning: boolean
  salary: number | null
  reset_day: number
  rollover_preference: string
  split_percentage: number
}

export interface SalaryHistory {
  id: number
  old_salary: number
  new_salary: number
  changed_on: string
  reason: string | null
  effective: string
}

// ─── API CALLS ────────────────────────────────────────

// Get current profile — returns null if not set up yet
export const getProfile = async (): Promise<UserProfile | null> => {
  try {
    const res = await axios.get(`${BASE_URL}/profile`)
    return res.data
  } catch (e) {
    // 404 means profile not created yet — return null
    return null
  }
}

// Create profile during onboarding
export const createProfile = async (data: {
  is_earning: boolean
  salary?: number
  rollover_preference: string
  split_percentage: number
}): Promise<UserProfile> => {
  const res = await axios.post(`${BASE_URL}/profile`, data)
  return res.data
}

// Update profile settings
export const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await axios.put(`${BASE_URL}/profile`, data)
  return res.data
}

// Update salary — saves to history automatically
export const updateSalary = async (data: {
  new_salary: number
  reason?: string
  effective: string
}): Promise<UserProfile> => {
  const res = await axios.put(`${BASE_URL}/profile/salary`, data)
  return res.data
}

// Get full salary history
export const getSalaryHistory = async (): Promise<SalaryHistory[]> => {
  const res = await axios.get(`${BASE_URL}/profile/salary/history`)
  return res.data
}
