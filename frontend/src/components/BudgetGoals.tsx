import { defineComponent, ref, onMounted, watch } from 'vue'
import { getBudgetGoals, setBudgetGoal, deleteBudgetGoal } from '../api/budget'
import type { BudgetGoal } from '../api/budget'
import { CATEGORIES, CATEGORY_CONFIG } from '../types/expense'
import { Target, Trash2, Plus } from 'lucide-vue-next'

export default defineComponent({
  name: 'BudgetGoals',

  // refreshKey is passed from Home.tsx
  // every time an expense is added/edited/deleted
  // refreshKey increments and this component reloads
  props: {
    refreshKey: {
      type: Number,
      default: 0
    }
  },

  setup(props) {
    const goals    = ref<BudgetGoal[]>([])
    const showForm = ref(false)
    const category = ref('food')
    const limit    = ref('')
    const loading  = ref(false)

    const currentMonth = new Date().toISOString().slice(0, 7)

    const loadGoals = async () => {
      goals.value = await getBudgetGoals(currentMonth)
    }

    const handleSetGoal = async () => {
      if (!limit.value || Number(limit.value) <= 0) return
      loading.value = true
      try {
        await setBudgetGoal({
          category: category.value,
          limit:    Number(limit.value),
          month:    currentMonth
        })
        limit.value    = ''
        showForm.value = false
        await loadGoals()
      } finally {
        loading.value = false
      }
    }

    const handleDelete = async (id: number) => {
      await deleteBudgetGoal(id)
      await loadGoals()
    }

    onMounted(loadGoals)

    // Watch for refreshKey changes
    // When Home.tsx adds/edits/deletes an expense
    // it increments refreshKey which triggers this
    watch(() => props.refreshKey, () => {
      loadGoals()
    })

    const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"

    return () => (
      <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">

        {/* Header */}
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center"
              style="background:#ede9fe"
            >
              <Target size={15} color="#7c3aed" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-gray-800">
                Category Limits
              </h2>
              <p class="text-xs text-gray-400">Set spending limits per category</p>
            </div>
          </div>
          <button
            onClick={() => showForm.value = !showForm.value}
            class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
          >
            <Plus size={12} />
            Set Limit
          </button>
        </div>

        {/* Add form */}
        {showForm.value && (
          <div class="bg-gray-50 rounded-xl p-4 mb-4 flex gap-3 items-end">
            <div class="flex-1">
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                value={category.value}
                onChange={(e: Event) =>
                  category.value = (e.target as HTMLSelectElement).value
                }
                class={inputClass}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_CONFIG[cat].icon} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Limit (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={limit.value}
                onInput={(e: Event) =>
                  limit.value = (e.target as HTMLInputElement).value
                }
                class={inputClass}
              />
            </div>
            <button
              onClick={handleSetGoal}
              disabled={loading.value}
              class="text-white text-sm font-medium px-4 py-2.5 rounded-xl"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
            >
              {loading.value ? '...' : 'Save'}
            </button>
          </div>
        )}

        {/* Goals list */}
        {goals.value.length === 0 ? (
          <p class="text-sm text-gray-400 text-center py-4">
            No limits set yet. Add one above!
          </p>
        ) : (
          <div class="flex flex-col gap-3">
            {goals.value.map(goal => {
              const config   = CATEGORY_CONFIG[goal.category]
              const isOver   = goal.spent > goal.limit
              const barPct   = Math.min(goal.percentage, 100)
              const barColor = isOver
                ? '#ef4444'
                : goal.percentage > 80
                  ? '#f97316'
                  : '#6366f1'

              return (
                <div key={goal.id} class="flex items-center gap-3">

                  {/* Category icon */}
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={`background:${config.bg}`}
                  >
                    {config.icon}
                  </div>

                  {/* Progress bar */}
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-medium text-gray-700 capitalize">
                        {goal.category}
                      </span>
                      <span
                        class="text-xs font-medium"
                        style={`color:${barColor}`}
                      >
                        ₹{goal.spent.toLocaleString()} / ₹{goal.limit.toLocaleString()}
                        {isOver && (
                          <span class="ml-1 text-red-500">
                            (₹{(goal.spent - goal.limit).toLocaleString()} over!)
                          </span>
                        )}
                      </span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        style={`width:${barPct}%;background:${barColor}`}
                      />
                    </div>
                    {/* Warning text under bar */}
                    {isOver && (
                      <p class="text-xs text-red-400 mt-0.5">
                        ⚠️ Over limit!
                      </p>
                    )}
                    {!isOver && goal.percentage > 80 && (
                      <p class="text-xs text-orange-400 mt-0.5">
                        ⚠️ Almost at limit!
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(goal.id)}
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
})
