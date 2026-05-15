import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Split {
  id: number
  expense_id: number
  friend_name: string
  amount_owed: number
  is_settled: boolean
  settled_date: string | null
}

export interface PendingSummary {
  total_pending: number
  pending_count: number
  by_friend: Record<string, number>
}

export const addSplits = async (
  expense_id: number,
  splits: { friend_name: string; amount_owed: number }[]
): Promise<Split[]> => {
  const res = await axios.post(`${BASE_URL}/splits/${expense_id}`, splits)
  return res.data
}

export const getSplitsByExpense = async (expense_id: number): Promise<Split[]> => {
  const res = await axios.get(`${BASE_URL}/splits/${expense_id}`)
  return res.data
}

export const settleSplit = async (
  split_id: number,
  settled_date: string
): Promise<Split> => {
  const res = await axios.put(`${BASE_URL}/splits/${split_id}/settle`, {
    settled_date
  })
  return res.data
}

export const getPendingSummary = async (): Promise<PendingSummary> => {
  const res = await axios.get(`${BASE_URL}/splits/summary/pending`)
  return res.data
}
