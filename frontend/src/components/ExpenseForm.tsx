import { defineComponent, ref } from 'vue'
import { CATEGORIES } from '../types/expense'
import type { ExpenseCreate } from '../types/expense'
import { PlusCircle, AlertCircle } from 'lucide-vue-next'
import { getBudgetGoals } from '../api/budget'
import type { BudgetGoal } from '../api/budget'
import SplitInput from './SplitInput'
import { addSplits } from '../api/splits'
import type { SplitEntry } from './SplitInput'

const CATEGORY_ICONS: Record<string, string> = {
  food:          '🍽️',
  rent:          '🏠',
  transport:     '🚗',
  shopping:      '🛍️',
  entertainment: '🎬',
  health:        '💊',
  other:         '📦'
}

export default defineComponent({
  name: 'ExpenseForm',
  props: {
    onSubmit: { type: Function, required: true }
  },

  setup(props) {
    const title    = ref('')
    const amount   = ref('')
    const category = ref('food')
    const date     = ref(new Date().toISOString().split('T')[0])
    const notes    = ref('')
    const error    = ref('')
    const loading  = ref(false)
    const budgetWarning = ref<BudgetGoal | null>(null)
    const showWarning   = ref(false)
    const isSplit  = ref(false)
const splits   = ref<SplitEntry[]>([])

  const handleSubmit = async () => {
  // Basic validation
  if (!title.value || !amount.value || !category.value || !date.value) {
    error.value = 'Please fill in all required fields'
    return
  }
  if (isNaN(Number(amount.value)) || Number(amount.value) <= 0) {
    error.value = 'Please enter a valid amount'
    return
  }

  error.value = ''

  // ── Budget goal check ──────────────────────────────
  // Get the current month in "YYYY-MM" format
  const currentMonth = new Date().toISOString().slice(0, 7)

  // Fetch goals for this month
  const goals = await getBudgetGoals(currentMonth)

  // Find if there's a goal for the selected category
  const matchingGoal = goals.find(g => g.category === category.value)

  if (matchingGoal) {
    // Calculate what spent will be AFTER adding this expense
    const newTotal = matchingGoal.spent + Number(amount.value)

    if (newTotal > matchingGoal.limit) {
      // Over budget — show warning and stop
      budgetWarning.value = {
        ...matchingGoal,
        spent: newTotal   // show what it would become
      }
      showWarning.value = true
      return
    }
  }

  // ── Save expense ───────────────────────────────────
  await saveExpense()
}

// Separated so we can call it from warning modal too
const saveExpense = async () => {
  // ── Validate splits FIRST before saving anything ──
  if (isSplit.value) {
    if (splits.value.length === 0) {
      error.value = 'Please add at least one friend and their amount'
      return
    }
    const totalSplitAmount = splits.value.reduce((sum, s) => sum + s.amount_owed, 0)
    if (totalSplitAmount >= Number(amount.value)) {
      error.value = 'Friends share cannot be equal to or more than total amount'
      return
    }
  }

  // ── Now save the expense ───────────────────────────
  loading.value = true

  const expense: ExpenseCreate = {
    title:    title.value.trim(),
    amount:   Number(amount.value),
    category: category.value,
    date:     date.value!,
    notes:    notes.value.trim() || undefined
  }

  try {
    // Save expense first
    const saved = await props.onSubmit(expense)

    // If split, save splits too
    if (isSplit.value && splits.value.length > 0 && saved?.id) {
      await addSplits(saved.id, splits.value)
    }

    // Reset form
    title.value    = ''
    amount.value   = ''
    category.value = 'food'
    date.value     = new Date().toISOString().split('T')[0]
    notes.value    = ''
    isSplit.value  = false
    splits.value   = []
    showWarning.value   = false
    budgetWarning.value = null
  } catch (e) {
    error.value = 'Failed to save expense. Please try again.'
  } finally {
    loading.value = false
  }
}

    const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 placeholder-gray-400 transition-all"

    return () => (
      <div class="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">

        {/* Header */}
        <div class="flex items-center gap-3 mb-5">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
            <PlusCircle size={18} color="white" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-800">Add New Expense</h2>
            <p class="text-xs text-gray-400">Fill in the details below</p>
          </div>
        </div>

        {/* Error */}
        {error.value && (
          <div class="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={15} />
            <span>{error.value}</span>
          </div>
        )}

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Title */}
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Title <span class="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch, Rent, Uber"
              value={title.value}
              onInput={(e: Event) => title.value = (e.target as HTMLInputElement).value}
              class={inputClass}
            />
          </div>

          {/* Amount */}
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Amount (₹) <span class="text-red-400">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 250"
              value={amount.value}
              onInput={(e: Event) => amount.value = (e.target as HTMLInputElement).value}
              class={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Category <span class="text-red-400">*</span>
            </label>
            <select
              value={category.value}
              onChange={(e: Event) => category.value = (e.target as HTMLSelectElement).value}
              class={inputClass}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Date <span class="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={date.value}
              onInput={(e: Event) => date.value = (e.target as HTMLInputElement).value}
              class={inputClass}
            />
          </div>

          {/* Notes */}
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Notes <span class="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Any extra details..."
              value={notes.value}
              onInput={(e: Event) => notes.value = (e.target as HTMLInputElement).value}
              class={inputClass}
            />
          </div>
        </div>
        {/* Split toggle */}
<div class="sm:col-span-2">
  <div class="flex items-center gap-3 mt-1">
    <button
      onClick={() => isSplit.value = !isSplit.value}
      class="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
      style={isSplit.value
        ? "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
        : "background:#e5e7eb"
      }
    >
      <span
        class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
        style={isSplit.value ? "left:calc(100% - 18px)" : "left:2px"}
      />
    </button>
    <span class="text-sm text-gray-600 font-medium">
      Split this expense with friends
    </span>
  </div>

  {/* Split input — only show when toggle is on */}
  {isSplit.value && (
    <SplitInput
      totalAmount={Number(amount.value) || 0}
      onSplitsChange={(s: SplitEntry[]) => splits.value = s}
    />
  )}
</div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading.value}
          class="mt-5 w-full text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          style={loading.value
            ? "background:#a5b4fc;cursor:not-allowed"
            : "background:linear-gradient(135deg,#6366f1,#8b5cf6);cursor:pointer"
          }
        >
          <PlusCircle size={16} />
          {loading.value ? 'Saving...' : 'Add Expense'}
        </button>
        {/* Budget warning modal */}
{showWarning.value && budgetWarning.value && (
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"
  >
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">

      {/* Icon */}
      <div
        class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style="background:#fff7ed"
      >
        <span class="text-2xl">⚠️</span>
      </div>

      <h3 class="text-base font-semibold text-gray-800 mb-1">
        Over Budget!
      </h3>

      <p class="text-sm text-gray-500 mb-2">
        You set a ₹{budgetWarning.value.limit.toLocaleString()} limit
        for <span class="font-medium capitalize">{budgetWarning.value.category}</span>
      </p>

      <div
        class="rounded-xl p-3 mb-5 text-sm"
        style="background:#fff7ed"
      >
        <div class="flex justify-between mb-1">
          <span class="text-gray-500">Already spent</span>
          <span class="font-medium text-gray-700">
            ₹{(budgetWarning.value.spent - Number(amount.value)).toLocaleString()}
          </span>
        </div>
        <div class="flex justify-between mb-1">
          <span class="text-gray-500">This expense</span>
          <span class="font-medium text-orange-500">
            + ₹{Number(amount.value).toLocaleString()}
          </span>
        </div>
        <div
          class="flex justify-between pt-2 mt-1 border-t border-orange-100 font-semibold"
        >
          <span class="text-gray-700">New total</span>
          <span class="text-red-500">
            ₹{budgetWarning.value.spent.toLocaleString()}
            {' '}(₹{(budgetWarning.value.spent - budgetWarning.value.limit).toLocaleString()} over)
          </span>
        </div>
      </div>

      <div class="flex gap-3">
        {/* Cancel — go back and change amount */}
        <button
          onClick={() => {
            showWarning.value   = false
            budgetWarning.value = null
          }}
          class="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
        >
          Go Back
        </button>

        {/* Add anyway — ignore the warning */}
        <button
          onClick={saveExpense}
          disabled={loading.value}
          class="flex-1 text-white font-medium py-2.5 rounded-xl text-sm"
          style="background:linear-gradient(135deg,#f97316,#ef4444)"
        >
          {loading.value ? 'Saving...' : 'Add Anyway'}
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    )
  }
})
