import { defineComponent, ref, onMounted } from 'vue'
import {
  getSavingsGoals,
  createSavingsGoal,
  deleteSavingsGoal,
  addToSavingsGoal
} from '../api/savings'
import type { SavingsGoal } from '../api/savings'
import { PiggyBank, Plus, Trash2, Trophy, PlusCircle } from 'lucide-vue-next'

export default defineComponent({
  name: 'SavingsGoals',

  setup() {
    const goals         = ref<SavingsGoal[]>([])
    const showForm      = ref(false)
    const name          = ref('')
    const target        = ref('')
    const monthly       = ref('')
    const loading       = ref(false)

    // Add money modal state
    const showAddModal  = ref(false)
    const selectedGoal  = ref<SavingsGoal | null>(null)
    const addAmount     = ref('')
    const addLoading    = ref(false)
    const addError      = ref('')

    const loadGoals = async () => {
      goals.value = await getSavingsGoals()
    }

    const handleCreate = async () => {
      if (!name.value || !target.value || !monthly.value) return
      loading.value = true
      try {
        await createSavingsGoal({
          name:           name.value.trim(),
          target_amount:  Number(target.value),
          monthly_saving: Number(monthly.value),
          created_date:   new Date().toISOString().slice(0, 10)
        })
        name.value     = ''
        target.value   = ''
        monthly.value  = ''
        showForm.value = false
        await loadGoals()
      } finally {
        loading.value = false
      }
    }

    const handleDelete = async (id: number) => {
      await deleteSavingsGoal(id)
      await loadGoals()
    }

    // Open add money modal for a specific goal
    const openAddModal = (goal: SavingsGoal) => {
      selectedGoal.value = goal
      addAmount.value    = ''
      addError.value     = ''
      showAddModal.value = true
    }

    // Add money to selected goal
    const handleAddMoney = async () => {
      if (!addAmount.value || Number(addAmount.value) <= 0) {
        addError.value = 'Please enter a valid amount'
        return
      }

      if (!selectedGoal.value) return

      addLoading.value = true
      addError.value   = ''

      try {
        await addToSavingsGoal(
          selectedGoal.value.id,
          Number(addAmount.value)
        )
        showAddModal.value = false
        selectedGoal.value = null
        addAmount.value    = ''
        await loadGoals()
      } catch (e) {
        addError.value = 'Failed to add money. Please try again.'
      } finally {
        addLoading.value = false
      }
    }

    onMounted(loadGoals)

    const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"

    return () => (
      <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">

        {/* Header */}
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center"
              style="background:#dcfce7"
            >
              <PiggyBank size={15} color="#16a34a" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-gray-800">
                Savings Goals
              </h2>
              <p class="text-xs text-gray-400">
                Track what you're saving for
              </p>
            </div>
          </div>
          <button
            onClick={() => showForm.value = !showForm.value}
            class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
          >
            <Plus size={12} />
            New Goal
          </button>
        </div>

        {/* Create goal form */}
        {showForm.value && (
          <div class="bg-gray-50 rounded-xl p-4 mb-4">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Goal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. MacBook Pro"
                  value={name.value}
                  onInput={(e: Event) =>
                    name.value = (e.target as HTMLInputElement).value
                  }
                  class={inputClass}
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Target (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 120000"
                  value={target.value}
                  onInput={(e: Event) =>
                    target.value = (e.target as HTMLInputElement).value
                  }
                  class={inputClass}
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Monthly (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={monthly.value}
                  onInput={(e: Event) =>
                    monthly.value = (e.target as HTMLInputElement).value
                  }
                  class={inputClass}
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading.value}
              class="mt-3 w-full text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
            >
              {loading.value ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        )}

        {/* Goals list */}
        {goals.value.length === 0 ? (
          <p class="text-sm text-gray-400 text-center py-4">
            No savings goals yet. Create one above!
          </p>
        ) : (
          <div class="flex flex-col gap-4">
            {goals.value.map(goal => (
              <div
                key={goal.id}
                class="border border-gray-100 rounded-xl p-4"
                style={goal.is_completed
                  ? "background:#f0fdf4;border-color:#bbf7d0"
                  : ""
                }
              >
                {/* Goal header */}
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    {goal.is_completed
                      ? <Trophy size={16} color="#16a34a" />
                      : <PiggyBank size={16} color="#6366f1" />
                    }
                    <span class="text-sm font-semibold text-gray-800">
                      {goal.name}
                    </span>
                    {goal.is_completed && (
                      <span
                        class="text-xs px-2 py-0.5 rounded-full font-medium"
                        style="background:#dcfce7;color:#16a34a"
                      >
                        Completed! 🎉
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div class="flex items-center gap-1">
                    {/* Add money button — only show if not completed */}
                    {!goal.is_completed && (
                      <button
                        onClick={() => openAddModal(goal)}
                        class="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                        style="background:#ede9fe;color:#7c3aed"
                      >
                        <PlusCircle size={12} />
                        Add Money
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(goal.id)}
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div class="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    style={`width:${goal.percentage}%;background:${
                      goal.is_completed
                        ? '#16a34a'
                        : 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    }`}
                  />
                </div>

                {/* Stats row */}
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <div class="flex items-center gap-3">
                    <span>
                      ₹{goal.saved_amount.toLocaleString()}
                      {' '}
                      <span class="text-gray-300">/</span>
                      {' '}
                      ₹{goal.target_amount.toLocaleString()}
                    </span>
                    <span
                      class="font-semibold"
                      style="color:#6366f1"
                    >
                      {goal.percentage}%
                    </span>
                  </div>

                  {!goal.is_completed && (
                    <span class="text-gray-400">
                      ~{goal.months_remaining} months left
                      {' · '}
                      ₹{goal.monthly_saving.toLocaleString()}/month
                    </span>
                  )}
                </div>

                {/* Remaining amount */}
                {!goal.is_completed && (
                  <div
                    class="mt-2 text-xs rounded-lg px-3 py-1.5"
                    style="background:#f5f3ff;color:#7c3aed"
                  >
                    ₹{(goal.target_amount - goal.saved_amount).toLocaleString()} more to go
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Add Money Modal ── */}
        {showAddModal.value && selectedGoal.value && (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"
            onClick={(e: MouseEvent) => {
              if (e.target === e.currentTarget) {
                showAddModal.value = false
              }
            }}
          >
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

              {/* Modal header */}
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center"
                  style="background:#dcfce7"
                >
                  <PiggyBank size={20} color="#16a34a" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-gray-800">
                    Add Money
                  </h3>
                  <p class="text-xs text-gray-400">
                    To: {selectedGoal.value.name}
                  </p>
                </div>
              </div>

              {/* Goal progress reminder */}
              <div
                class="rounded-xl p-3 mb-4 text-xs"
                style="background:#f5f3ff"
              >
                <div class="flex justify-between mb-1">
                  <span class="text-gray-500">Already saved</span>
                  <span class="font-medium text-gray-700">
                    ₹{selectedGoal.value.saved_amount.toLocaleString()}
                  </span>
                </div>
                <div class="flex justify-between mb-1">
                  <span class="text-gray-500">Target</span>
                  <span class="font-medium text-gray-700">
                    ₹{selectedGoal.value.target_amount.toLocaleString()}
                  </span>
                </div>
                <div class="flex justify-between font-semibold border-t border-purple-100 pt-1 mt-1">
                  <span style="color:#7c3aed">Still needed</span>
                  <span style="color:#7c3aed">
                    ₹{(selectedGoal.value.target_amount - selectedGoal.value.saved_amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div class="mb-4">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Amount to add (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={addAmount.value}
                  onInput={(e: Event) =>
                    addAmount.value = (e.target as HTMLInputElement).value
                  }
                  class={inputClass}
                  autofocus
                />
                {addError.value && (
                  <p class="text-red-500 text-xs mt-1">{addError.value}</p>
                )}
              </div>

              {/* Quick amount buttons */}
              <div class="flex gap-2 mb-5">
                {[1000, 2000, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => addAmount.value = String(amt)}
                    class="flex-1 text-xs font-medium py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    ₹{amt >= 1000 ? `${amt/1000}k` : amt}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div class="flex gap-3">
                <button
                  onClick={() => showAddModal.value = false}
                  class="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMoney}
                  disabled={addLoading.value}
                  class="flex-1 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
                  style={addLoading.value
                    ? "background:#86efac"
                    : "background:linear-gradient(135deg,#16a34a,#15803d)"
                  }
                >
                  {addLoading.value ? 'Adding...' : 'Add to Goal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
})
