export interface Expense {
  id: number
  title: string
  amount: number
  category: string
  date: string
  notes?: string
}

export interface ExpenseCreate {
  title: string
  amount: number
  category: string
  date: string
  notes?: string
}

export interface ExpenseUpdate {
  title?: string
  amount?: number
  category?: string
  date?: string
  notes?: string
}

export const CATEGORIES = [
  'food',
  'rent',
  'transport',
  'shopping',
  'entertainment',
  'health',
  'other'
]

export const CATEGORY_CONFIG: Record<string, {
  icon: string
  bg: string
  color: string
}> = {
  food:          { icon: '🍽️', bg: '#fef9c3', color: '#854d0e' },
  rent:          { icon: '🏠', bg: '#dbeafe', color: '#1e40af' },
  transport:     { icon: '🚗', bg: '#dcfce7', color: '#166534' },
  shopping:      { icon: '🛍️', bg: '#fce7f3', color: '#9d174d' },
  entertainment: { icon: '🎬', bg: '#ede9fe', color: '#5b21b6' },
  health:        { icon: '💊', bg: '#fee2e2', color: '#991b1b' },
  other:         { icon: '📦', bg: '#f1f5f9', color: '#475569' }
}
