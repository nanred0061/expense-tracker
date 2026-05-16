import { defineComponent } from 'vue'
import type { Expense } from '../types/expense'
import { Pencil, Trash2 } from 'lucide-vue-next'

// Emoji and color for each category
const CATEGORY_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  food:          { icon: '🍽️', bg: '#fef9c3', color: '#854d0e' },
  rent:          { icon: '🏠', bg: '#dbeafe', color: '#1e40af' },
  transport:     { icon: '🚗', bg: '#dcfce7', color: '#166534' },
  shopping:      { icon: '🛍️', bg: '#fce7f3', color: '#9d174d' },
  entertainment: { icon: '🎬', bg: '#ede9fe', color: '#5b21b6' },
  health:        { icon: '💊', bg: '#fee2e2', color: '#991b1b' },
  other:         { icon: '📦', bg: '#f1f5f9', color: '#475569' }
}

export default defineComponent({
  name: 'ExpenseCard',

  props: {
    expense: {
      type: Object as () => Expense,
      required: true
    },
    onEdit: {
      type: Function,
      required: true
    },
    onDelete: {
      type: Function,
      required: true
    }
  },

  setup(props) {
const config = CATEGORY_CONFIG[props.expense.category] || CATEGORY_CONFIG.other
    // Format date from "2025-04-18" to "Apr 18, 2025"
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    return () => (
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">

        {/* Category icon */}
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
       style={`background:${config?.bg || '#f1f5f9'}`}
        >
          {config?.icon || '📋'}
        </div>

        {/* Expense details */}
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-gray-800 text-sm capitalize">
                {props.expense.title}
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={`background:${config?.bg || '#f1f5f9'};color:${config?.color || '#475569'}`}
                >
                  {props.expense.category}
                </span>
                <span class="text-xs text-gray-400">
                  {formatDate(props.expense.date)}
                </span>

              </div>
              {/* Notes if present */}
              {props.expense.notes && (
                <p class="text-xs text-gray-400 mt-1 truncate">
                  {props.expense.notes}
                </p>
              )}
            </div>

            {/* Amount */}
            <p class="text-lg font-bold text-gray-900 flex-shrink-0">
              ₹{props.expense.amount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div class="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => props.onEdit(props.expense)}
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => props.onDelete(props.expense.id)}
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }
})
