import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface BudgetSummary {
  month: string
  salary: number
  extra_income: number
  total_budget: number
  total_spent: number
  remaining: number
  remaining_percentage: number
  is_over_budget: boolean
  warning: boolean
}

export interface BudgetGoal {
  id: number
  category: string
  limit: number
  month: string
  spent: number
  remaining: number
  percentage: number
}

// Get current month budget summary
export const getBudgetSummary = async (): Promise<BudgetSummary> => {
  const res = await axios.get(`${BASE_URL}/budget/summary`)
  return res.data
}

// Get budget summary for specific month
export const getBudgetSummaryByMonth = async (month: string): Promise<BudgetSummary> => {
  const res = await axios.get(`${BASE_URL}/budget/summary/${month}`)
  return res.data
}

// Set spending limit for a category
export const setBudgetGoal = async (data: {
  category: string
  limit: number
  month: string
}): Promise<BudgetGoal> => {
  const res = await axios.post(`${BASE_URL}/budget/goals`, data)
  return res.data
}

// Get all budget goals for a month
export const getBudgetGoals = async (month: string): Promise<BudgetGoal[]> => {
  const res = await axios.get(`${BASE_URL}/budget/goals/${month}`)
  return res.data
}

// Delete a budget goal
export const deleteBudgetGoal = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/budget/goals/${id}`)
}
