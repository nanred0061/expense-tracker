import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createProfile } from '../api/profile'
import { Wallet, TrendingUp, PiggyBank } from 'lucide-vue-next'

export default defineComponent({
  name: 'OnboardingComponent',

  setup() {
    const router     = useRouter()
    const step       = ref(1)
    const isEarning  = ref<boolean | null>(null)
    const salary     = ref('')
    const splitPct   = ref(50)
    const loading    = ref(false)
    const error      = ref('')

    const handleComplete = async () => {
      loading.value = true
      error.value   = ''
      try {
        await createProfile({
          is_earning:          isEarning.value ?? false,
          salary:              isEarning.value ? Number(salary.value) : undefined,
          rollover_preference: 'split',
          split_percentage:    splitPct.value
        })
        // Go to home after onboarding
        router.push('/')
      } catch (e: any) {
        // If profile already exists just go home
        if (e.response?.status === 400) {
          router.push('/')
        } else {
          error.value = 'Something went wrong. Please try again.'
        }
      } finally {
        loading.value = false
      }
    }

    const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"

    return () => (
      <div
        class="min-h-screen flex items-center justify-center p-6"
        style="background:linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#f0fdf4 100%)"
      >
        {/* Background blobs */}
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
          <div style="position:absolute;top:-80px;right:-80px;width:400px;height:400px;background:rgba(139,92,246,0.08);border-radius:50%;filter:blur(60px)"/>
          <div style="position:absolute;bottom:-100px;left:-60px;width:500px;height:500px;background:rgba(59,130,246,0.07);border-radius:50%;filter:blur(80px)"/>
        </div>

        <div class="relative z-10 bg-white rounded-3xl shadow-xl w-full max-w-md p-8">

          {/* Logo */}
          <div class="flex items-center gap-3 mb-8">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
            >
              <Wallet size={20} color="white" />
            </div>
            <div>
              <h1 class="text-lg font-bold text-gray-900 leading-none">
                Expense Tracker
              </h1>
              <p class="text-xs text-gray-400">Let's get you set up</p>
            </div>
          </div>

          {/* Step indicator */}
          <div class="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                class="h-1.5 flex-1 rounded-full transition-all"
                style={s <= step.value
                  ? "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                  : "background:#e5e7eb"
                }
              />
            ))}
          </div>

          {/* ── Step 1 — Earning or not ── */}
          {step.value === 1 && (
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-1">
                Are you currently earning?
              </h2>
              <p class="text-sm text-gray-400 mb-6">
                This helps us set up your budget correctly
              </p>

              <div class="flex flex-col gap-3">
                <button
                  onClick={() => { isEarning.value = true; step.value = 2 }}
                  class="w-full border-2 rounded-2xl p-4 text-left transition-all"
                  style={isEarning.value === true
                    ? "border-color:#6366f1;background:#f5f3ff"
                    : "border-color:#e5e7eb;background:white"
                  }
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center"
                      style="background:#ede9fe"
                    >
                      <TrendingUp size={18} color="#7c3aed" />
                    </div>
                    <div>
                      <p class="font-semibold text-gray-800 text-sm">
                        Yes, I have a salary
                      </p>
                      <p class="text-xs text-gray-400">
                        Track budget against your income
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { isEarning.value = false; step.value = 3 }}
                  class="w-full border-2 rounded-2xl p-4 text-left transition-all"
                  style={isEarning.value === false
                    ? "border-color:#6366f1;background:#f5f3ff"
                    : "border-color:#e5e7eb;background:white"
                  }
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center"
                      style="background:#dbeafe"
                    >
                      <PiggyBank size={18} color="#2563eb" />
                    </div>
                    <div>
                      <p class="font-semibold text-gray-800 text-sm">
                        No, just tracking expenses
                      </p>
                      <p class="text-xs text-gray-400">
                        No budget limit, just track spending
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2 — Enter salary ── */}
          {step.value === 2 && (
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-1">
                What's your monthly salary?
              </h2>
              <p class="text-sm text-gray-400 mb-6">
                Your budget resets to this on the 1st of every month
              </p>

              <div class="mb-4">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Monthly Salary (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 30000"
                  value={salary.value}
                  onInput={(e: Event) =>
                    salary.value = (e.target as HTMLInputElement).value
                  }
                  class={inputClass}
                />
              </div>

              {error.value && (
                <p class="text-red-500 text-xs mb-3">{error.value}</p>
              )}

              <div class="flex gap-3 mt-6">
                <button
                  onClick={() => step.value = 1}
                  class="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!salary.value || Number(salary.value) <= 0) {
                      error.value = 'Please enter a valid salary'
                      return
                    }
                    error.value = ''
                    step.value  = 3
                  }}
                  class="flex-1 text-white font-medium py-3 rounded-xl text-sm"
                  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3 — Rollover preference ── */}
          {step.value === 3 && (
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-1">
                What happens to leftover money?
              </h2>
              <p class="text-sm text-gray-400 mb-6">
                At end of each month, leftover budget gets split between
                savings and next month's budget
              </p>

              <div class="bg-indigo-50 rounded-2xl p-4 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">
                    Savings goal
                  </span>
                  <span class="text-sm font-bold" style="color:#6366f1">
                    {splitPct.value}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitPct.value}
                  onInput={(e: Event) =>
                    splitPct.value = Number((e.target as HTMLInputElement).value)
                  }
                  class="w-full accent-indigo-500"
                />
                <div class="flex justify-between mt-1">
                  <span class="text-xs text-gray-400">
                    Carry forward: {100 - splitPct.value}%
                  </span>
                  <span class="text-xs text-gray-400">
                    Savings: {splitPct.value}%
                  </span>
                </div>
              </div>

              {/* Example */}
              <div class="bg-gray-50 rounded-xl p-3 mb-6 text-xs text-gray-500">
                <p class="font-medium text-gray-600 mb-1">Example:</p>
                <p>If ₹2,500 is left at month end:</p>
                <p>→ ₹{Math.round(2500 * splitPct.value / 100).toLocaleString()} goes to savings</p>
                <p>→ ₹{Math.round(2500 * (100 - splitPct.value) / 100).toLocaleString()} added to next month</p>
              </div>

              {error.value && (
                <p class="text-red-500 text-xs mb-3 text-center">{error.value}</p>
              )}

              <div class="flex gap-3">
                <button
                  onClick={() => step.value = isEarning.value ? 2 : 1}
                  class="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading.value}
                  class="flex-1 text-white font-medium py-3 rounded-xl text-sm"
                  style={loading.value
                    ? "background:#a5b4fc"
                    : "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                  }
                >
                  {loading.value ? 'Setting up...' : 'Get Started 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
})
