import axios from 'axios'
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../types/expense'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const getExpenses = async (): Promise<Expense[]> => {
  const res = await axios.get(`${BASE_URL}/expenses`)
  return res.data
}

export const getExpense = async (id: number): Promise<Expense> => {
  const res = await axios.get(`${BASE_URL}/expenses/${id}`)
  return res.data
}

export const createExpense = async (expense: ExpenseCreate): Promise<Expense> => {
  const res = await axios.post(`${BASE_URL}/expenses`, expense)
  return res.data
}

export const updateExpense = async (id: number, updates: ExpenseUpdate): Promise<Expense> => {
  const res = await axios.put(`${BASE_URL}/expenses/${id}`, updates)
  return res.data
}

export const deleteExpense = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/expenses/${id}`)
}
