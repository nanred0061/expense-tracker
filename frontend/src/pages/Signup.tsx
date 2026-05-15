import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { signup, saveToken } from '../api/auth'
import { Wallet, Eye, EyeOff } from 'lucide-vue-next'

export default defineComponent({
  name: 'SignupComponent',

  setup() {
    const router   = useRouter()
    const name     = ref('')
    const email    = ref('')
    const password = ref('')
    const confirm  = ref('')
    const showPass = ref(false)
    const loading  = ref(false)
    const error    = ref('')

    const handleSignup = async () => {
      if (!name.value || !email.value || !password.value || !confirm.value) {
        error.value = 'Please fill in all fields'
        return
      }
      if (password.value !== confirm.value) {
        error.value = 'Passwords do not match'
        return
      }
      if (password.value.length < 6) {
        error.value = 'Password must be at least 6 characters'
        return
      }
      loading.value = true
      error.value   = ''
      try {
        const res = await signup(name.value, email.value, password.value)
        saveToken(res.access_token, res.name, res.user_id)
        // New user → go to onboarding
        router.push('/onboarding')
      } catch (e: any) {
        error.value = e.response?.data?.detail || 'Signup failed. Please try again.'
      } finally {
        loading.value = false
      }
    }

    const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-gray-800"

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
              <p class="text-xs text-gray-400">Create your account</p>
            </div>
          </div>

          {/* Heading */}
          <h2 class="text-2xl font-bold text-gray-900 mb-1">
            Get started!
          </h2>
          <p class="text-sm text-gray-400 mb-6">
            Create your free account in seconds
          </p>

          {/* Error */}
          {error.value && (
            <div
              class="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4"
            >
              {error.value}
            </div>
          )}

          {/* Fields */}
          <div class="flex flex-col gap-4 mb-6">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Arnava"
                value={name.value}
                onInput={(e: Event) =>
                  name.value = (e.target as HTMLInputElement).value
                }
                class={inputClass}
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email.value}
                onInput={(e: Event) =>
                  email.value = (e.target as HTMLInputElement).value
                }
                class={inputClass}
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div class="relative">
                <input
                  type={showPass.value ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password.value}
                  onInput={(e: Event) =>
                    password.value = (e.target as HTMLInputElement).value
                  }
                  class={inputClass}
                  style="padding-right:44px"
                />
                <button
                  onClick={() => showPass.value = !showPass.value}
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.value
                    ? <EyeOff size={16} />
                    : <Eye size={16} />
                  }
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirm.value}
                onInput={(e: Event) =>
                  confirm.value = (e.target as HTMLInputElement).value
                }
                class={inputClass}
              />
            </div>
          </div>

          {/* Sign up button */}
          <button
            onClick={handleSignup}
            disabled={loading.value}
            class="w-full text-white font-semibold py-3 rounded-xl text-sm transition-all mb-4"
            style={loading.value
              ? "background:#a5b4fc"
              : "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
            }
          >
            {loading.value ? 'Creating account...' : 'Create Account'}
          </button>

          {/* Login link */}
          <p class="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              class="font-semibold"
              style="color:#6366f1"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    )
  }
})
