import { defineComponent, ref, onMounted, computed } from 'vue'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import EditModal from '../components/EditModal'
import BudgetBar from '../components/BudgetBar'
import BudgetGoals from '../components/BudgetGoals'
import SavingsGoals from '../components/SavingsGoals'
import { createExpense, getExpenses, updateExpense, deleteExpense } from '../api/expenses'
import { getProfile } from '../api/profile'
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../types/expense'
import type { UserProfile } from '../api/profile'
import { Wallet, TrendingUp, Receipt, PiggyBank, Settings } from 'lucide-vue-next'
import PendingSplits from '../components/PendingSplits'
import { useRouter } from 'vue-router'
import { Bot } from 'lucide-vue-next'
import { getBillAlerts } from '../api/bills'
import type { BillAlert } from '../api/bills'
import { CreditCard } from 'lucide-vue-next'
import { clearToken, getUserName } from '../api/auth'
import { LogOut } from 'lucide-vue-next'


export default defineComponent({
  name: 'HomePage',
  setup() {
    const expenses       = ref<Expense[]>([])
    const profile        = ref<UserProfile | null>(null)
    const editingExpense = ref<Expense | null>(null)
    const showDeleteId   = ref<number | null>(null)
    const deleteLoading  = ref(false)
    const refreshKey     = ref(0)
    const router = useRouter()
    const billAlerts = ref<BillAlert[]>([])
    const userName = getUserName()

const handleLogout = () => {
  clearToken()
  router.push('/login')
}

const loadAlerts = async () => {
  billAlerts.value = await getBillAlerts()
}

    const totalSpend = computed(() =>
      expenses.value.reduce((sum, e) => sum + e.amount, 0)
    )

    const thisMonthSpend = computed(() => {
      const now   = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return expenses.value
        .filter(e => e.date.startsWith(month))
        .reduce((sum, e) => sum + e.amount, 0)
    })

    const topCategory = computed(() => {
      if (!expenses.value.length) return '—'
      const counts: Record<string, number> = {}
      expenses.value.forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + e.amount
      })
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      return sorted.length > 0 ? sorted[0]?.[0] ?? '—' : '—'
    })

    const loadExpenses = async () => {
      expenses.value = await getExpenses()
    }

    const loadProfile = async () => {
      profile.value = await getProfile()
    }

const handleAddExpense = async (expense: ExpenseCreate) => {
  const saved = await createExpense(expense)
  await loadExpenses()
  refreshKey.value++
  return saved  // ← return so ExpenseForm can use the id for splits
}

    const handleEdit = (expense: Expense) => {
      editingExpense.value = expense
    }

    const handleSaveEdit = async (updates: ExpenseUpdate) => {
      if (!editingExpense.value) return
      await updateExpense(editingExpense.value.id, updates)
      editingExpense.value = null
      await loadExpenses()
      refreshKey.value++
    }

    const handleDelete = (id: number) => {
      showDeleteId.value = id
    }

    const confirmDelete = async () => {
      if (!showDeleteId.value) return
      deleteLoading.value = true
      await deleteExpense(showDeleteId.value)
      showDeleteId.value  = null
      deleteLoading.value = false
      await loadExpenses()
      refreshKey.value++
    }

    onMounted(async () => {
      await loadProfile()
      await loadExpenses()
      await loadAlerts()
    })

    return () => (
      <div
        class="min-h-screen"
        style="background:linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#f0fdf4 100%)"
      >
        {/* Background blobs */}
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
          <div style="position:absolute;top:-80px;right:-80px;width:400px;height:400px;background:rgba(139,92,246,0.08);border-radius:50%;filter:blur(60px)"/>
          <div style="position:absolute;bottom:-100px;left:-60px;width:500px;height:500px;background:rgba(59,130,246,0.07);border-radius:50%;filter:blur(80px)"/>
          <div style="position:absolute;top:40%;left:40%;width:300px;height:300px;background:rgba(16,185,129,0.05);border-radius:50%;filter:blur(60px)"/>
        </div>

        {/* Navbar */}
        <nav
          class="relative z-10 px-6 py-4"
          style="background:rgba(255,255,255,0.7);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.8)"
        >
          <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
              >
                <Wallet size={18} color="white" />
              </div>
              <div>
                <h1 class="text-lg font-bold text-gray-900 leading-none">
                  Expense Tracker
                </h1>
                <p class="text-xs text-gray-400 mt-0.5">Personal Finance Manager</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              {profile.value && (
                <div class="text-right">
                  <p class="text-xs text-gray-400">
                    {profile.value.is_earning ? 'Earning mode' : 'Tracking mode'}
                  </p>
                  {profile.value.salary && (
                    <p class="text-xs font-medium text-gray-600">
                      ₹{profile.value.salary.toLocaleString()}/month
                    </p>
                  )}
                </div>
              )}

              <button
  onClick={() => router.push('/ai')}
  class="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
>
  <Bot size={15} />
  Ask AI
</button>
<button
  onClick={() => router.push('/bills')}
  class="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
  style="background:linear-gradient(135deg,#f97316,#ef4444)"
>
  <CreditCard size={15} />
  Bills
</button>
              {/* Add this in navbar, next to the Live badge */}
<div class="flex items-center gap-3">
  {userName && (
    <span class="text-sm text-gray-600 font-medium">
      Hi, {userName}! 👋
    </span>
  )}
  <button
    onClick={handleLogout}
    class="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
  >
    <LogOut size={14} />
    Logout
  </button>
</div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div class="relative z-10 max-w-4xl mx-auto px-6 py-8">

          {/* Hero */}
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-1">
              Your Finances,{' '}
              <span style="background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
                Simplified
              </span>
            </h2>
            <p class="text-gray-500 text-sm">Track every rupee. Stay in control.</p>
          </div>
          {/* Bill alerts banner */}
{billAlerts.value.length > 0 && (
  <div class="mb-6 flex flex-col gap-2">
    {billAlerts.value.slice(0, 3).map((alert, index) => (
      <div
        key={index}
        class="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium"
        style={
          alert.color === 'red'
            ? "background:#fee2e2;color:#991b1b"
            : alert.color === 'orange'
              ? "background:#fff7ed;color:#9a3412"
              : "background:#fefce8;color:#854d0e"
        }
      >
        <span>{alert.message}</span>
        <span class="font-bold">
          ₹{alert.amount.toLocaleString()}
        </span>
      </div>
    ))}
  </div>
)}

          {/* Stats cards */}
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-white/80">
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  style="background:#ede9fe"
                >
                  <TrendingUp size={15} color="#7c3aed" />
                </div>
                <span class="text-xs text-gray-500 font-medium">Total Spent</span>
              </div>
              <p class="text-2xl font-bold text-gray-900">
                ₹{totalSpend.value.toLocaleString()}
              </p>
            </div>

            <div class="bg-white rounded-2xl p-4 shadow-sm border border-white/80">
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  style="background:#dbeafe"
                >
                  <Receipt size={15} color="#2563eb" />
                </div>
                <span class="text-xs text-gray-500 font-medium">This Month</span>
              </div>
              <p class="text-2xl font-bold text-gray-900">
                ₹{thisMonthSpend.value.toLocaleString()}
              </p>
            </div>

            <div class="bg-white rounded-2xl p-4 shadow-sm border border-white/80">
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  style="background:#dcfce7"
                >
                  <PiggyBank size={15} color="#16a34a" />
                </div>
                <span class="text-xs text-gray-500 font-medium">Top Category</span>
              </div>
              <p class="text-2xl font-bold text-gray-900 capitalize">
                {topCategory.value}
              </p>
            </div>
          </div>

          {/* Budget bar — only show if earning */}
          {profile.value?.is_earning && (
            <BudgetBar
              key={refreshKey.value}
              onUpdate={() => refreshKey.value++}
            />
          )}

          {/* Budget goals */}
          <BudgetGoals refreshKey={refreshKey.value} />
          <PendingSplits refreshKey={refreshKey.value} />

          {/* Savings goals */}
          <SavingsGoals />

          {/* Add expense form */}
          <ExpenseForm onSubmit={handleAddExpense} />

          {/* Expense list */}
          {expenses.value.length > 0 ? (
            <ExpenseList
              expenses={expenses.value}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div class="text-center py-16">
              <div
                class="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style="background:linear-gradient(135deg,#ede9fe,#dbeafe)"
              >
                <Receipt size={28} color="#6366f1" />
              </div>
              <p class="text-gray-700 font-medium mb-1">No expenses yet</p>
              <p class="text-sm text-gray-400">
                Add your first expense using the form above!
              </p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <EditModal
          expense={editingExpense.value}
          onSave={handleSaveEdit}
          onClose={() => editingExpense.value = null}
        />

        {/* Delete modal */}
        {showDeleteId.value && (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"
          >
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <div
                class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style="background:#fee2e2"
              >
                <span class="text-2xl">🗑️</span>
              </div>
              <h3 class="text-base font-semibold text-gray-800 mb-1">
                Delete Expense?
              </h3>
              <p class="text-sm text-gray-400 mb-5">
                This action cannot be undone.
              </p>
              <div class="flex gap-3">
                <button
                  onClick={() => showDeleteId.value = null}
                  class="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading.value}
                  class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl text-sm"
                >
                  {deleteLoading.value ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
})
