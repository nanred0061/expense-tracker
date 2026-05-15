import { defineComponent, ref, computed } from 'vue'
import type { Expense } from '../types/expense'
import { CATEGORIES } from '../types/expense'
import ExpenseCard from './ExpenseCard'
import { Filter } from 'lucide-vue-next'

export default defineComponent({
  name: 'ExpenseList',

  props: {
    expenses: {
      type: Array as () => Expense[],
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
    // Currently selected filter — 'all' means show everything
    const selectedCategory = ref('all')

    // Filtered list based on selected category
    const filteredExpenses = computed(() => {
      if (selectedCategory.value === 'all') return props.expenses
      return props.expenses.filter(e => e.category === selectedCategory.value)
    })

    // Total of filtered expenses
    const filteredTotal = computed(() =>
      filteredExpenses.value.reduce((sum, e) => sum + e.amount, 0)
    )

    return () => (
      <div>
        {/* Header row with filter */}
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold text-gray-800">
              Expenses
            </h2>
            <p class="text-xs text-gray-400">
              {filteredExpenses.value.length} of {props.expenses.length} shown
              {' · '}
              Total: ₹{filteredTotal.value.toLocaleString()}
            </p>
          </div>

          {/* Category filter */}
          <div class="flex items-center gap-2">
            <Filter size={14} class="text-gray-400" />
            <select
              value={selectedCategory.value}
              onChange={(e: Event) =>
                selectedCategory.value = (e.target as HTMLSelectElement).value
              }
              class="text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense cards */}
        <div class="flex flex-col gap-3">
          {filteredExpenses.value.length === 0 ? (
            <div class="text-center py-10 text-gray-400">
              <p class="text-3xl mb-2">🔍</p>
              <p class="text-sm">No expenses in this category</p>
            </div>
          ) : (
            // Show newest first by reversing the array
            [...filteredExpenses.value]
              .reverse()
              .map(expense => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={props.onEdit}
                  onDelete={props.onDelete}
                />
              ))
          )}
        </div>
      </div>
    )
  }
})
