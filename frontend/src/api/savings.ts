import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface SavingsGoal {
  id: number
  name: string
  target_amount: number
  saved_amount: number
  monthly_saving: number
  created_date: string
  is_completed: boolean
  months_remaining: number
  percentage: number
}

export const getSavingsGoals = async (): Promise<SavingsGoal[]> => {
  const res = await axios.get(`${BASE_URL}/savings`)
  return res.data
}

export const createSavingsGoal = async (data: {
  name: string
  target_amount: number
  monthly_saving: number
  created_date: string
}): Promise<SavingsGoal> => {
  const res = await axios.post(`${BASE_URL}/savings`, data)
  return res.data
}

export const updateSavingsGoal = async (
  id: number,
  data: Partial<SavingsGoal>
): Promise<SavingsGoal> => {
  const res = await axios.put(`${BASE_URL}/savings/${id}`, data)
  return res.data
}

export const addToSavingsGoal = async (
  id: number,
  amount: number
): Promise<SavingsGoal> => {
  const res = await axios.post(`${BASE_URL}/savings/${id}/add?amount=${amount}`)
  return res.data
}

export const deleteSavingsGoal = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/savings/${id}`)
}
