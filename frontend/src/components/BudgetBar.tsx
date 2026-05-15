import { defineComponent, ref, onMounted } from 'vue'
import { getBudgetSummary } from '../api/budget'
import type { BudgetSummary } from '../api/budget'
import { addIncome } from '../api/income'
import { PlusCircle, TrendingUp, AlertTriangle, XCircle } from 'lucide-vue-next'

export default defineComponent({
  name: 'BudgetBar',
  props: {
    onUpdate: {
      type: Function,
      required: true
    }
  },

  setup(props) {
    const budget       = ref<BudgetSummary | null>(null)
    const showModal    = ref(false)
    const incomeAmount = ref('')
    const incomeSource = ref('freelance')
    const incomeNotes  = ref('')
    const loading      = ref(false)

    const SOURCES = [
      'freelance', 'bonus', 'gift', 'refund', 'other'
    ]

    const loadBudget = async () => {
      budget.value = await getBudgetSummary()
    }

    const handleAddIncome = async () => {
      if (!incomeAmount.value || Number(incomeAmount.value) <= 0) return
      loading.value = true
      try {
        const today        = new Date()
        const currentMonth = today.toISOString().slice(0, 7)
        await addIncome({
          amount:  Number(incomeAmount.value),
          source:  incomeSource.value,
          type:    'one_time',
          month:   currentMonth,
          date:    today.toISOString().slice(0, 10),
          notes:   incomeNotes.value || undefined
        })
        incomeAmount.value = ''
        incomeNotes.value  = ''
        showModal.value    = false
        await loadBudget()
        props.onUpdate()
      } finally {
        loading.value = false
      }
    }

    onMounted(loadBudget)

    const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"

    return () => {
      if (!budget.value) return null

      const b           = budget.value
      const barColor    = b.is_over_budget
        ? '#ef4444'
        : b.warning
          ? '#f97316'
          : '#6366f1'
      const bgColor     = b.is_over_budget
        ? '#fef2f2'
        : b.warning
          ? '#fff7ed'
          : '#f5f3ff'
      const pct         = Math.max(0, Math.min(100, b.remaining_percentage))

      return (
        <div
          class="rounded-2xl p-5 mb-6 border"
          style={`background:${bgColor};border-color:${barColor}22`}
        >
          {/* Header */}
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              {b.is_over_budget
                ? <XCircle size={18} color="#ef4444" />
                : b.warning
                  ? <AlertTriangle size={18} color="#f97316" />
                  : <TrendingUp size={18} color="#6366f1" />
              }
              <span class="text-sm font-semibold text-gray-700">
                Budget this month
              </span>
            </div>
            <button
              onClick={() => showModal.value = true}
              class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
            >
              <PlusCircle size={12} />
              Add Income
            </button>
          </div>

          {/* Amount */}
          <div class="flex items-end justify-between mb-3">
            <div>
              <p
                class="text-2xl font-bold"
                style={`color:${barColor}`}
              >
                ₹{Math.abs(b.remaining).toLocaleString()}
                <span class="text-sm font-normal text-gray-400 ml-1">
                  {b.is_over_budget ? 'over budget' : 'remaining'}
                </span>
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                ₹{b.total_spent.toLocaleString()} spent of ₹{b.total_budget.toLocaleString()}
                {b.extra_income > 0 && (
                  <span class="text-green-500 ml-1">
                    (+₹{b.extra_income.toLocaleString()} extra income)
                  </span>
                )}
              </p>
            </div>
            <span
              class="text-lg font-bold"
              style={`color:${barColor}`}
            >
              {pct.toFixed(0)}%
            </span>
          </div>

          {/* Progress bar */}
          <div class="w-full bg-white rounded-full h-2.5 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              style={`width:${pct}%;background:${barColor}`}
            />
          </div>

          {/* Warning messages */}
          {b.is_over_budget && (
            <p class="text-xs text-red-500 mt-2 font-medium">
              ⚠️ You are over budget! Add extra income to continue adding expenses.
            </p>
          )}
          {b.warning && !b.is_over_budget && (
            <p class="text-xs text-orange-500 mt-2 font-medium">
              ⚠️ Less than 20% of your budget remaining. Spend carefully!
            </p>
          )}

          {/* Add income modal */}
          {showModal.value && (
            <div
              class="fixed inset-0 z-50 flex items-center justify-center p-4"
              style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"
              onClick={(e: MouseEvent) => {
                if (e.target === e.currentTarget) showModal.value = false
              }}
            >
              <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                <h3 class="text-base font-semibold text-gray-800 mb-4">
                  Add Extra Income
                </h3>

                <div class="flex flex-col gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={incomeAmount.value}
                      onInput={(e: Event) =>
                        incomeAmount.value = (e.target as HTMLInputElement).value
                      }
                      class={inputClass}
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Source
                    </label>
                    <select
                      value={incomeSource.value}
                      onChange={(e: Event) =>
                        incomeSource.value = (e.target as HTMLSelectElement).value
                      }
                      class={inputClass}
                    >
                      {SOURCES.map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Logo design project"
                      value={incomeNotes.value}
                      onInput={(e: Event) =>
                        incomeNotes.value = (e.target as HTMLInputElement).value
                      }
                      class={inputClass}
                    />
                  </div>
                </div>

                <div class="flex gap-3 mt-5">
                  <button
                    onClick={() => showModal.value = false}
                    class="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddIncome}
                    disabled={loading.value}
                    class="flex-1 text-white font-medium py-2.5 rounded-xl text-sm"
                    style={loading.value
                      ? "background:#a5b4fc"
                      : "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                    }
                  >
                    {loading.value ? 'Adding...' : 'Add Income'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }
  }
})
