import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Income {
  id: number
  amount: number
  source: string
  type: string
  month: string
  date: string
  notes?: string
}

export const addIncome = async (data: {
  amount: number
  source: string
  type: string
  month: string
  date: string
  notes?: string
}): Promise<Income> => {
  const res = await axios.post(`${BASE_URL}/income`, data)
  return res.data
}

export const getIncomeByMonth = async (month: string): Promise<Income[]> => {
  const res = await axios.get(`${BASE_URL}/income/${month}`)
  return res.data
}

export const deleteIncome = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/income/${id}`)
}
