import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Bill {
  id:             number
  name:           string
  type:           string
  amount:         number
  due_day:        number
  is_recurring:   boolean
  is_active:      boolean
  notes?:         string
  is_paid:        boolean
  amount_paid?:   number
  days_until_due: number
  is_overdue:     boolean
}

export interface BillAlert {
  bill_id: number
  name:    string
  amount:  number
  type:    string
  days:    number
  message: string
  color:   string
}

export interface SafeToSpend {
  budget_remaining: number
  upcoming_bills:   number
  safe_to_spend:    number
  is_safe:          boolean
  bills_this_month: {
    name:    string
    amount:  number
    due_day: number
    type:    string
  }[]
}

export interface RecurringExpense {
  id:           number
  title:        string
  amount:       number
  category:     string
  day_of_month: number
  is_active:    boolean
  notes?:       string
}

export const getBills = async (): Promise<Bill[]> => {
  const res = await axios.get(`${BASE_URL}/bills`)
  return res.data
}

export const createBill = async (data: {
  name:         string
  type:         string
  amount:       number
  due_day:      number
  is_recurring: boolean
  notes?:       string
}): Promise<Bill> => {
  const res = await axios.post(`${BASE_URL}/bills`, data)
  return res.data
}

export const updateBill = async (
  id: number,
  data: Partial<Bill>
): Promise<Bill> => {
  const res = await axios.put(`${BASE_URL}/bills/${id}`, data)
  return res.data
}

export const deleteBill = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/bills/${id}`)
}

export const payBill = async (
  id: number,
  amount_paid: number,
  paid_date: string
): Promise<void> => {
  await axios.post(`${BASE_URL}/bills/${id}/pay`, {
    amount_paid,
    paid_date
  })
}

export const getBillAlerts = async (): Promise<BillAlert[]> => {
  const res = await axios.get(`${BASE_URL}/bills/alerts/active`)
  return res.data
}

export const getSafeToSpend = async (): Promise<SafeToSpend> => {
  const res = await axios.get(`${BASE_URL}/bills/summary/safe-to-spend`)
  return res.data
}

export const getRecurring = async (): Promise<RecurringExpense[]> => {
  const res = await axios.get(`${BASE_URL}/recurring`)
  return res.data
}

export const createRecurring = async (data: {
  title:        string
  amount:       number
  category:     string
  day_of_month: number
  notes?:       string
}): Promise<RecurringExpense> => {
  const res = await axios.post(`${BASE_URL}/recurring`, data)
  return res.data
}

export const deleteRecurring = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/recurring/${id}`)
}
