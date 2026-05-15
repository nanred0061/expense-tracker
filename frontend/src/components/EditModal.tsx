import { defineComponent, ref, watch } from 'vue'
import type { Expense, ExpenseUpdate } from '../types/expense'
import { CATEGORIES } from '../types/expense'
import { X, Save } from 'lucide-vue-next'

export default defineComponent({
  name: 'EditModal',

  props: {
    expense: {
      type: Object as () => Expense | null,
      default: null
    },
    onSave: {
      type: Function,
      required: true
    },
    onClose: {
      type: Function,
      required: true
    }
  },

  setup(props) {
    const title    = ref('')
    const amount   = ref('')
    const category = ref('food')
    const date     = ref('')
    const notes    = ref('')
    const loading  = ref(false)

    // When the expense prop changes (modal opens with new expense)
    // pre-fill all the fields with existing values
    watch(() => props.expense, (newExpense) => {
      if (newExpense) {
        title.value    = newExpense.title
        amount.value   = String(newExpense.amount)
        category.value = newExpense.category
        date.value     = newExpense.date
        notes.value    = newExpense.notes || ''
      }
    }, { immediate: true })

    const handleSave = async () => {
      loading.value = true
      const updates: ExpenseUpdate = {
        title:    title.value.trim(),
        amount:   Number(amount.value),
        category: category.value,
        date:     date.value,
        notes:    notes.value.trim() || undefined
      }
      try {
        await props.onSave(updates)
      } finally {
        loading.value = false
      }
    }

    const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"

    return () => {
      // Don't render anything if no expense is being edited
      if (!props.expense) return null

      return (
        // Backdrop
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"
          onClick={(e: MouseEvent) => {
            // Close if clicking the backdrop (not the modal itself)
            if (e.target === e.currentTarget) props.onClose()
          }}
        >
          {/* Modal box */}
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            {/* Modal header */}
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-base font-semibold text-gray-800">
                Edit Expense
              </h2>
              <button
                onClick={() => props.onClose()}
                class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Fields */}
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  value={title.value}
                  onInput={(e: Event) => title.value = (e.target as HTMLInputElement).value}
                  class={inputClass}
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Amount (₹)</label>
                <input
                  type="number"
                  value={amount.value}
                  onInput={(e: Event) => amount.value = (e.target as HTMLInputElement).value}
                  class={inputClass}
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={date.value}
                  onInput={(e: Event) => date.value = (e.target as HTMLInputElement).value}
                  class={inputClass}
                />
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Category</label>
                <select
                  value={category.value}
                  onChange={(e: Event) => category.value = (e.target as HTMLSelectElement).value}
                  class={inputClass}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes</label>
                <input
                  type="text"
                  value={notes.value}
                  onInput={(e: Event) => notes.value = (e.target as HTMLInputElement).value}
                  class={inputClass}
                />
              </div>
            </div>

            {/* Buttons */}
            <div class="flex gap-3 mt-5">
              <button
                onClick={() => props.onClose()}
                class="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading.value}
                class="flex-1 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                style={loading.value
                  ? "background:#a5b4fc"
                  : "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                }
              >
                <Save size={14} />
                {loading.value ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )
    }
  }
})
