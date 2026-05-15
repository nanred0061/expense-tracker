import { defineComponent, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  getBills, createBill, deleteBill, payBill,
  getRecurring, createRecurring, deleteRecurring,
  getSafeToSpend
} from '../api/bills'
import type { Bill, RecurringExpense, SafeToSpend } from '../api/bills'
import { CATEGORIES, CATEGORY_CONFIG } from '../types/expense'
import {
  ArrowLeft, Plus, Trash2, CheckCircle,
  CreditCard, Zap, RefreshCw, AlertTriangle,
  ShieldCheck, Clock, Repeat
} from 'lucide-vue-next'

const BILL_TYPES = [
  { value: 'credit_card',   label: 'Credit Card',   icon: '💳' },
  { value: 'utility',       label: 'Utility',        icon: '⚡' },
  { value: 'subscription',  label: 'Subscription',   icon: '📱' },
  { value: 'emi',           label: 'EMI / Loan',     icon: '🏛️' },
  { value: 'other',         label: 'Other',          icon: '📋' }
]

const BILL_COLORS: Record<string, { bg: string; color: string }> = {
  credit_card:  { bg: '#fce7f3', color: '#9d174d' },
  utility:      { bg: '#fef9c3', color: '#854d0e' },
  subscription: { bg: '#ede9fe', color: '#5b21b6' },
  emi:          { bg: '#dbeafe', color: '#1e40af' },
  other:        { bg: '#f1f5f9', color: '#475569' }
}

export default defineComponent({
  name: 'BillsSection',

  setup() {
    const router       = useRouter()
    const bills        = ref<Bill[]>([])
    const recurring    = ref<RecurringExpense[]>([])
    const safeToSpend  = ref<SafeToSpend | null>(null)
    const activeTab    = ref<'bills' | 'recurring'>('bills')

    // Add bill form
    const showBillForm    = ref(false)
    const billName        = ref('')
    const billType        = ref('credit_card')
    const billAmount      = ref('')
    const billDueDay      = ref('1')
    const billRecurring   = ref(true)
    const billNotes       = ref('')
    const billLoading     = ref(false)

    // Pay bill modal
    const showPayModal    = ref(false)
    const payingBill      = ref<Bill | null>(null)
    const payAmount       = ref('')
    const payLoading      = ref(false)

    // Add recurring form
    const showRecurForm   = ref(false)
    const recurTitle      = ref('')
    const recurAmount     = ref('')
    const recurCategory   = ref('rent')
    const recurDay        = ref('1')
    const recurNotes      = ref('')
    const recurLoading    = ref(false)

    const loadAll = async () => {
      bills.value       = await getBills()
      recurring.value   = await getRecurring()
      safeToSpend.value = await getSafeToSpend()
    }

    // Separate bills into sections
    const overdueBills  = computed(() =>
      bills.value.filter(b => b.is_overdue)
    )
    const todayBills    = computed(() =>
      bills.value.filter(b => b.days_until_due === 0 && !b.is_overdue)
    )
    const upcomingBills = computed(() =>
      bills.value.filter(b => b.days_until_due > 0 && !b.is_paid)
    )
    const paidBills     = computed(() =>
      bills.value.filter(b => b.is_paid)
    )

    const handleCreateBill = async () => {
      if (!billName.value || !billAmount.value) return
      billLoading.value = true
      try {
        await createBill({
          name:         billName.value.trim(),
          type:         billType.value,
          amount:       Number(billAmount.value),
          due_day:      Number(billDueDay.value),
          is_recurring: billRecurring.value,
          notes:        billNotes.value || undefined
        })
        billName.value      = ''
        billAmount.value    = ''
        billDueDay.value    = '1'
        billNotes.value     = ''
        showBillForm.value  = false
        await loadAll()
      } finally {
        billLoading.value = false
      }
    }

    const openPayModal = (bill: Bill) => {
      payingBill.value = bill
      payAmount.value  = String(bill.amount)
      showPayModal.value = true
    }

    const handlePayBill = async () => {
      if (!payingBill.value || !payAmount.value) return
      payLoading.value = true
      try {
        await payBill(
          payingBill.value.id,
          Number(payAmount.value),
          new Date().toISOString().slice(0, 10)
        )
        showPayModal.value = false
        payingBill.value   = null
        await loadAll()
      } finally {
        payLoading.value = false
      }
    }

    const handleDeleteBill = async (id: number) => {
      await deleteBill(id)
      await loadAll()
    }

    const handleCreateRecurring = async () => {
      if (!recurTitle.value || !recurAmount.value) return
      recurLoading.value = true
      try {
        await createRecurring({
          title:        recurTitle.value.trim(),
          amount:       Number(recurAmount.value),
          category:     recurCategory.value,
          day_of_month: Number(recurDay.value),
          notes:        recurNotes.value || undefined
        })
        recurTitle.value    = ''
        recurAmount.value   = ''
        recurDay.value      = '1'
        recurNotes.value    = ''
        showRecurForm.value = false
        await loadAll()
      } finally {
        recurLoading.value = false
      }
    }

    const handleDeleteRecurring = async (id: number) => {
      await deleteRecurring(id)
      await loadAll()
    }

    onMounted(loadAll)

    const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"

    const BillCard = (bill: Bill) => {
      const config  = BILL_COLORS[bill.type] || BILL_COLORS.other
      const billType = BILL_TYPES.find(t => t.value === bill.type)

      return (
        <div
          key={bill.id}
          class="bg-white border rounded-2xl p-4 flex items-center gap-4"
          style={bill.is_overdue
            ? "border-color:#fca5a5"
            : bill.days_until_due === 0
              ? "border-color:#fcd34d"
              : "border-color:#f1f5f9"
          }
        >
          {/* Icon */}
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={`background:${config.bg}`}
          >
            {billType?.icon || '📋'}
          </div>

          {/* Details */}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <p class="text-sm font-semibold text-gray-800">
                {bill.name}
              </p>
              {bill.is_paid && (
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  style="background:#dcfce7;color:#16a34a"
                >
                  Paid ✓
                </span>
              )}
              {bill.is_overdue && (
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  style="background:#fee2e2;color:#991b1b"
                >
                  Overdue!
                </span>
              )}
            </div>
            <p class="text-xs text-gray-400">
              Due {bill.due_day}{
                bill.due_day === 1 ? 'st' :
                bill.due_day === 2 ? 'nd' :
                bill.due_day === 3 ? 'rd' : 'th'
              } of month
              {bill.is_recurring && (
                <span class="ml-1 text-indigo-400">· Recurring</span>
              )}
            </p>
            {!bill.is_paid && (
              <p
                class="text-xs font-medium mt-0.5"
                style={
                  bill.is_overdue ? "color:#ef4444" :
                  bill.days_until_due === 0 ? "color:#f59e0b" :
                  bill.days_until_due <= 3 ? "color:#f97316" :
                  "color:#6b7280"
                }
              >
                {bill.is_overdue
                  ? `${Math.abs(bill.days_until_due)} days overdue`
                  : bill.days_until_due === 0
                    ? "Due today!"
                    : `Due in ${bill.days_until_due} days`
                }
              </p>
            )}
          </div>

          {/* Amount + actions */}
          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="text-right">
              <p class="text-base font-bold text-gray-900">
                ₹{bill.amount.toLocaleString()}
              </p>
              {bill.is_paid && bill.amount_paid && bill.amount_paid !== bill.amount && (
                <p class="text-xs text-gray-400">
                  Paid ₹{bill.amount_paid.toLocaleString()}
                </p>
              )}
            </div>

            {!bill.is_paid && (
              <button
                onClick={() => openPayModal(bill)}
                class="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl text-white transition-colors"
                style="background:linear-gradient(135deg,#16a34a,#15803d)"
              >
                <CheckCircle size={13} />
                Pay
              </button>
            )}

            <button
              onClick={() => handleDeleteBill(bill.id)}
              class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )
    }

    return () => (
      <div
        class="min-h-screen"
        style="background:linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#f0fdf4 100%)"
      >
        {/* Background blobs */}
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
          <div style="position:absolute;top:-80px;right:-80px;width:400px;height:400px;background:rgba(139,92,246,0.08);border-radius:50%;filter:blur(60px)"/>
          <div style="position:absolute;bottom:-100px;left:-60px;width:500px;height:500px;background:rgba(59,130,246,0.07);border-radius:50%;filter:blur(80px)"/>
        </div>

        {/* Navbar */}
        <nav
          class="relative z-10 px-6 py-4"
          style="background:rgba(255,255,255,0.7);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.8)"
        >
          <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                class="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft size={18} />
              </button>
              <div class="flex items-center gap-2">
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center"
                  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                >
                  <CreditCard size={18} color="white" />
                </div>
                <div>
                  <h1 class="text-lg font-bold text-gray-900 leading-none">
                    Bills & Recurring
                  </h1>
                  <p class="text-xs text-gray-400 mt-0.5">
                    Track upcoming payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div class="relative z-10 max-w-4xl mx-auto px-6 py-6">

          {/* Safe to spend card */}
          {safeToSpend.value && (
            <div
              class="rounded-2xl p-5 mb-6 border"
              style={safeToSpend.value.is_safe
                ? "background:#f0fdf4;border-color:#bbf7d0"
                : "background:#fef2f2;border-color:#fca5a5"
              }
            >
              <div class="flex items-center gap-2 mb-3">
                {safeToSpend.value.is_safe
                  ? <ShieldCheck size={18} color="#16a34a" />
                  : <AlertTriangle size={18} color="#ef4444" />
                }
                <span class="text-sm font-semibold text-gray-700">
                  Safe to Spend
                </span>
              </div>

              <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="bg-white rounded-xl p-3 text-center">
                  <p class="text-xs text-gray-400 mb-1">Budget left</p>
                  <p class="text-base font-bold text-gray-800">
                    ₹{safeToSpend.value.budget_remaining.toLocaleString()}
                  </p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center">
                  <p class="text-xs text-gray-400 mb-1">Upcoming bills</p>
                  <p class="text-base font-bold text-orange-500">
                    − ₹{safeToSpend.value.upcoming_bills.toLocaleString()}
                  </p>
                </div>
                <div class="bg-white rounded-xl p-3 text-center">
                  <p class="text-xs text-gray-400 mb-1">Safe to spend</p>
                  <p
                    class="text-base font-bold"
                    style={safeToSpend.value.is_safe
                      ? "color:#16a34a"
                      : "color:#ef4444"
                    }
                  >
                    ₹{Math.abs(safeToSpend.value.safe_to_spend).toLocaleString()}
                    {!safeToSpend.value.is_safe && ' over'}
                  </p>
                </div>
              </div>

              {!safeToSpend.value.is_safe && (
                <p class="text-xs text-red-500 font-medium">
                  ⚠️ Your upcoming bills exceed your remaining budget!
                  Consider adding income or reducing expenses.
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div class="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
            <button
              onClick={() => activeTab.value = 'bills'}
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={activeTab.value === 'bills'
                ? "background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white"
                : "color:#6b7280"
              }
            >
              <CreditCard size={15} />
              Bills
            </button>
            <button
              onClick={() => activeTab.value = 'recurring'}
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={activeTab.value === 'recurring'
                ? "background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white"
                : "color:#6b7280"
              }
            >
              <Repeat size={15} />
              Recurring
            </button>
          </div>

          {/* ── Bills Tab ── */}
          {activeTab.value === 'bills' && (
            <div>
              {/* Add bill button */}
              <div class="flex justify-end mb-4">
                <button
                  onClick={() => showBillForm.value = !showBillForm.value}
                  class="flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-xl"
                  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                >
                  <Plus size={15} />
                  Add Bill
                </button>
              </div>

              {/* Add bill form */}
              {showBillForm.value && (
                <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
                  <h3 class="text-sm font-semibold text-gray-800 mb-4">
                    New Bill
                  </h3>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Bill Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Credit Card"
                        value={billName.value}
                        onInput={(e: Event) =>
                          billName.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Type
                      </label>
                      <select
                        value={billType.value}
                        onChange={(e: Event) =>
                          billType.value = (e.target as HTMLSelectElement).value
                        }
                        class={inputClass}
                      >
                        {BILL_TYPES.map(t => (
                          <option key={t.value} value={t.value}>
                            {t.icon} {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 15000"
                        value={billAmount.value}
                        onInput={(e: Event) =>
                          billAmount.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Due Day (1-31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g. 15"
                        value={billDueDay.value}
                        onInput={(e: Event) =>
                          billDueDay.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Any extra details"
                        value={billNotes.value}
                        onInput={(e: Event) =>
                          billNotes.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                    <div class="sm:col-span-2 flex items-center gap-3">
                      <button
                        onClick={() => billRecurring.value = !billRecurring.value}
                        class="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                        style={billRecurring.value
                          ? "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                          : "background:#e5e7eb"
                        }
                      >
                        <span
                          class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                          style={billRecurring.value
                            ? "left:calc(100% - 18px)"
                            : "left:2px"
                          }
                        />
                      </button>
                      <span class="text-sm text-gray-600">
                        Auto-reset this bill every month
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateBill}
                    disabled={billLoading.value}
                    class="mt-4 w-full text-white font-medium py-2.5 rounded-xl text-sm"
                    style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                  >
                    {billLoading.value ? 'Adding...' : 'Add Bill'}
                  </button>
                </div>
              )}

              {/* Overdue */}
              {overdueBills.value.length > 0 && (
                <div class="mb-5">
                  <p class="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                    💀 Overdue
                  </p>
                  <div class="flex flex-col gap-3">
                    {overdueBills.value.map(b => BillCard(b))}
                  </div>
                </div>
              )}

              {/* Due today */}
              {todayBills.value.length > 0 && (
                <div class="mb-5">
                  <p class="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">
                    🔴 Due Today
                  </p>
                  <div class="flex flex-col gap-3">
                    {todayBills.value.map(b => BillCard(b))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcomingBills.value.length > 0 && (
                <div class="mb-5">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    📋 Upcoming
                  </p>
                  <div class="flex flex-col gap-3">
                    {upcomingBills.value.map(b => BillCard(b))}
                  </div>
                </div>
              )}

              {/* Paid */}
              {paidBills.value.length > 0 && (
                <div class="mb-5">
                  <p class="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2">
                    ✅ Paid this month
                  </p>
                  <div class="flex flex-col gap-3">
                    {paidBills.value.map(b => BillCard(b))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {bills.value.length === 0 && !showBillForm.value && (
                <div class="text-center py-12">
                  <div
                    class="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style="background:linear-gradient(135deg,#ede9fe,#dbeafe)"
                  >
                    <CreditCard size={28} color="#6366f1" />
                  </div>
                  <p class="text-gray-700 font-medium mb-1">No bills yet</p>
                  <p class="text-sm text-gray-400">
                    Add your first bill using the button above!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Recurring Tab ── */}
          {activeTab.value === 'recurring' && (
            <div>
              <div class="flex justify-end mb-4">
                <button
                  onClick={() => showRecurForm.value = !showRecurForm.value}
                  class="flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-xl"
                  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                >
                  <Plus size={15} />
                  Add Recurring
                </button>
              </div>

              {/* Add recurring form */}
              {showRecurForm.value && (
                <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
                  <h3 class="text-sm font-semibold text-gray-800 mb-4">
                    New Recurring Expense
                  </h3>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. House Rent"
                        value={recurTitle.value}
                        onInput={(e: Event) =>
                          recurTitle.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 8000"
                        value={recurAmount.value}
                        onInput={(e: Event) =>
                          recurAmount.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Category
                      </label>
                      <select
                        value={recurCategory.value}
                        onChange={(e: Event) =>
                          recurCategory.value = (e.target as HTMLSelectElement).value
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
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Auto-add on day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g. 1"
                        value={recurDay.value}
                        onInput={(e: Event) =>
                          recurDay.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                    <div class="sm:col-span-2">
                      <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Any extra details"
                        value={recurNotes.value}
                        onInput={(e: Event) =>
                          recurNotes.value = (e.target as HTMLInputElement).value
                        }
                        class={inputClass}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateRecurring}
                    disabled={recurLoading.value}
                    class="mt-4 w-full text-white font-medium py-2.5 rounded-xl text-sm"
                    style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                  >
                    {recurLoading.value ? 'Adding...' : 'Add Recurring Expense'}
                  </button>
                </div>
              )}

              {/* Recurring list */}
              {recurring.value.length === 0 && !showRecurForm.value ? (
                <div class="text-center py-12">
                  <div
                    class="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style="background:linear-gradient(135deg,#ede9fe,#dbeafe)"
                  >
                    <Repeat size={28} color="#6366f1" />
                  </div>
                  <p class="text-gray-700 font-medium mb-1">
                    No recurring expenses
                  </p>
                  <p class="text-sm text-gray-400">
                    Add expenses that repeat every month like rent
                  </p>
                </div>
              ) : (
                <div class="flex flex-col gap-3">
                  {recurring.value.map(r => {
                    const config = CATEGORY_CONFIG[r.category]
                    return (
                      <div
                        key={r.id}
                        class="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4"
                      >
                        <div
                          class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={`background:${config.bg}`}
                        >
                          {config.icon}
                        </div>
                        <div class="flex-1">
                          <p class="text-sm font-semibold text-gray-800">
                            {r.title}
                          </p>
                          <p class="text-xs text-gray-400">
                            Auto-adds on {r.day_of_month}{
                              r.day_of_month === 1 ? 'st' :
                              r.day_of_month === 2 ? 'nd' :
                              r.day_of_month === 3 ? 'rd' : 'th'
                            } every month · {r.category}
                          </p>
                        </div>
                        <div class="flex items-center gap-2">
                          <p class="text-base font-bold text-gray-900">
                            ₹{r.amount.toLocaleString()}
                          </p>
                          <button
                            onClick={() => handleDeleteRecurring(r.id)}
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pay bill modal */}
        {showPayModal.value && payingBill.value && (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            style="background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)"
            onClick={(e: MouseEvent) => {
              if (e.target === e.currentTarget) showPayModal.value = false
            }}
          >
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center"
                  style="background:#dcfce7"
                >
                  <CheckCircle size={20} color="#16a34a" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-gray-800">
                    Pay Bill
                  </h3>
                  <p class="text-xs text-gray-400">
                    {payingBill.value.name}
                  </p>
                </div>
              </div>

              {/* Bill details */}
              <div
                class="rounded-xl p-3 mb-4 text-sm"
                style="background:#f0fdf4"
              >
                <div class="flex justify-between mb-1">
                  <span class="text-gray-500">Bill amount</span>
                  <span class="font-medium text-gray-700">
                    ₹{payingBill.value.amount.toLocaleString()}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Due day</span>
                  <span class="font-medium text-gray-700">
                    {payingBill.value.due_day}th of month
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div class="mb-4">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Amount paying (₹)
                </label>
                <input
                  type="number"
                  value={payAmount.value}
                  onInput={(e: Event) =>
                    payAmount.value = (e.target as HTMLInputElement).value
                  }
                  class={inputClass}
                />
                <p class="text-xs text-gray-400 mt-1">
                  This will be automatically added to your expenses
                </p>
              </div>

              {/* Quick amount buttons */}
              <div class="flex gap-2 mb-5">
                <button
                  onClick={() => payAmount.value = String(payingBill.value!.amount)}
                  class="flex-1 text-xs font-medium py-2 rounded-lg border-2 transition-colors"
                  style="border-color:#16a34a;color:#16a34a;background:#f0fdf4"
                >
                  Full ₹{payingBill.value.amount.toLocaleString()}
                </button>
                <button
                  onClick={() =>
                    payAmount.value = String(
                      Math.round(payingBill.value!.amount * 0.05)
                    )
                  }
                  class="flex-1 text-xs font-medium py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Min (5%)
                </button>
              </div>

              <div class="flex gap-3">
                <button
                  onClick={() => showPayModal.value = false}
                  class="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayBill}
                  disabled={payLoading.value}
                  class="flex-1 text-white font-medium py-2.5 rounded-xl text-sm"
                  style="background:linear-gradient(135deg,#16a34a,#15803d)"
                >
                  {payLoading.value ? 'Paying...' : 'Mark as Paid ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
})
