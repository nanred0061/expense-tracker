import { defineComponent, ref, onMounted, watch } from 'vue'
import { getPendingSummary, getSplitsByExpense, settleSplit } from '../api/splits'
import type { PendingSummary } from '../api/splits'
import { Users, CheckCircle, Clock } from 'lucide-vue-next'
import { getExpenses } from '../api/expenses'
import type { Expense } from '../types/expense'

interface FriendSplit {
  splitId: number
  expenseId: number
  expenseTitle: string
  friendName: string
  amount: number
  isSettled: boolean
  settledDate: string | null
}

export default defineComponent({
  name: 'PendingSplits',

  props: {
    refreshKey: {
      type: Number,
      default: 0
    }
  },

  setup(props) {
    const summary         = ref<PendingSummary | null>(null)
    const pendingSplits   = ref<FriendSplit[]>([])
    const settledSplits   = ref<FriendSplit[]>([])
    const settling        = ref<number | null>(null)
    const confirmSplitId  = ref<number | null>(null)
    const confirmFriendName = ref('')
    const confirmAmount   = ref(0)
    const showHistory     = ref(false)

    const loadSplits = async () => {
      // Get pending summary
      summary.value = await getPendingSummary()

      // Get all expenses
      const expenses = await getExpenses()

      // Collect all splits across all expenses
      const allPending:  FriendSplit[] = []
      const allSettled:  FriendSplit[] = []

      for (const expense of expenses) {
        const splits = await getSplitsByExpense(expense.id)

        splits.forEach(s => {
          const entry: FriendSplit = {
            splitId:      s.id,
            expenseId:    expense.id,
            expenseTitle: expense.title,
            friendName:   s.friend_name,
            amount:       s.amount_owed,
            isSettled:    s.is_settled,
            settledDate:  s.settled_date
          }
          if (s.is_settled) {
            allSettled.push(entry)
          } else {
            allPending.push(entry)
          }
        })
      }

      pendingSplits.value = allPending
      settledSplits.value = allSettled
    }

    const openConfirm = (
      splitId: number,
      friendName: string,
      amount: number
    ) => {
      confirmSplitId.value    = splitId
      confirmFriendName.value = friendName
      confirmAmount.value     = amount
    }

    const handleSettle = async () => {
      if (!confirmSplitId.value) return
      settling.value = confirmSplitId.value
      try {
        await settleSplit(
          confirmSplitId.value,
          new Date().toISOString().slice(0, 10)
        )
        confirmSplitId.value = null
        await loadSplits()
      } finally {
        settling.value = null
      }
    }

    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })

    onMounted(loadSplits)
    watch(() => props.refreshKey, loadSplits)

    return () => {
      // Don't show card if no splits at all
      if (pendingSplits.value.length === 0 && settledSplits.value.length === 0) {
        return null
      }

      return (
        <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">

          {/* Header */}
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                style="background:#dbeafe"
              >
                <Users size={15} color="#2563eb" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-gray-800">
                  Split Expenses
                </h2>
                <p class="text-xs text-gray-400">
                  {pendingSplits.value.length > 0
                    ? `₹${(summary.value?.total_pending || 0).toLocaleString()} pending`
                    : 'All settled!'
                  }
                </p>
              </div>
            </div>

            {/* Badges */}
            <div class="flex items-center gap-2">
              {pendingSplits.value.length > 0 && (
                <span
                  class="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style="background:#fef9c3;color:#854d0e"
                >
                  {pendingSplits.value.length} pending
                </span>
              )}
              {settledSplits.value.length > 0 && (
                <button
                  onClick={() => showHistory.value = !showHistory.value}
                  class="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
                  style={showHistory.value
                    ? "background:#dcfce7;color:#166534"
                    : "background:#f1f5f9;color:#475569"
                  }
                >
                  {settledSplits.value.length} settled
                </button>
              )}
            </div>
          </div>

          {/* ── Pending splits ── */}
          {pendingSplits.value.length > 0 && (
            <div class="mb-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pending
              </p>
              <div class="flex flex-col gap-2">
                {pendingSplits.value.map(split => (
                  <div
                    key={split.splitId}
                    class="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3"
                  >
                    <div>
                      <div class="flex items-center gap-2">
                        <Clock size={13} color="#f59e0b" />
                        <p class="text-sm font-medium text-gray-800 capitalize">
                          {split.friendName}
                        </p>
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5 ml-5">
                        {split.expenseTitle}
                      </p>
                    </div>

                    <div class="flex items-center gap-3">
                      <span class="text-sm font-bold text-gray-800">
                        ₹{split.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => openConfirm(
                          split.splitId,
                          split.friendName,
                          split.amount
                        )}
                        disabled={settling.value === split.splitId}
                        class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style="background:#dcfce7;color:#16a34a"
                      >
                        <CheckCircle size={13} />
                        {settling.value === split.splitId
                          ? 'Settling...'
                          : 'Mark Settled'
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending total */}
              <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span class="text-sm font-semibold text-gray-700">
                  Total pending
                </span>
                <span
                  class="text-base font-bold"
                  style="color:#f59e0b"
                >
                  ₹{(summary.value?.total_pending || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* ── Settled history ── */}
          {showHistory.value && settledSplits.value.length > 0 && (
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Settled History
              </p>
              <div class="flex flex-col gap-2">
                {settledSplits.value.map(split => (
                  <div
                    key={split.splitId}
                    class="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3"
                  >
                    <div>
                      <div class="flex items-center gap-2">
                        <CheckCircle size={13} color="#16a34a" />
                        <p class="text-sm font-medium text-gray-800 capitalize">
                          {split.friendName}
                        </p>
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5 ml-5">
                        {split.expenseTitle}
                        {split.settledDate && (
                          <span class="ml-1">
                            · Paid on {formatDate(split.settledDate)}
                          </span>
                        )}
                      </p>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-gray-400 line-through">
                        ₹{split.amount.toLocaleString()}
                      </span>
                      <span
                        class="text-xs font-medium px-2 py-0.5 rounded-full"
                        style="background:#dcfce7;color:#16a34a"
                      >
                        Paid ✓
                      </span>
                    </div>
                  </div>
                ))}

                {/* Settled total */}
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <span class="text-sm font-semibold text-gray-700">
                    Total received
                  </span>
                  <span
                    class="text-base font-bold"
                    style="color:#16a34a"
                  >
                    ₹{settledSplits.value
                        .reduce((sum, s) => sum + s.amount, 0)
                        .toLocaleString()
                      }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* All settled state */}
          {pendingSplits.value.length === 0 && settledSplits.value.length > 0 && !showHistory.value && (
            <div class="text-center py-2">
              <p class="text-sm text-green-600 font-medium">
                🎉 All splits settled! Click "{settledSplits.value.length} settled" to view history.
              </p>
            </div>
          )}

          {/* Confirm modal */}
          {confirmSplitId.value && (
            <div
              class="fixed inset-0 z-50 flex items-center justify-center p-4"
              style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"
            >
              <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                <div
                  class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style="background:#dcfce7"
                >
                  <CheckCircle size={28} color="#16a34a" />
                </div>

                <h3 class="text-base font-semibold text-gray-800 mb-1">
                  Mark as Settled?
                </h3>
                <p class="text-sm text-gray-500 mb-1">
                  Confirm that{' '}
                  <span class="font-medium text-gray-700 capitalize">
                    {confirmFriendName.value}
                  </span>{' '}
                  paid back
                </p>
                <p
                  class="text-2xl font-bold mb-5"
                  style="color:#16a34a"
                >
                  ₹{confirmAmount.value.toLocaleString()}
                </p>

                <div class="flex gap-3">
                  <button
                    onClick={() => confirmSplitId.value = null}
                    class="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettle}
                    disabled={settling.value !== null}
                    class="flex-1 text-white font-medium py-2.5 rounded-xl text-sm"
                    style="background:linear-gradient(135deg,#16a34a,#15803d)"
                  >
                    {settling.value ? 'Settling...' : 'Yes, Settled ✓'}
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
