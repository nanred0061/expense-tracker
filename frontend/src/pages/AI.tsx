import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  sendChatMessage,
  getInsights,
  getPrediction,
  getWeeklyTip
} from '../api/ai'
import type { ChatMessage } from '../api/ai'
import {
  Bot, Send, Sparkles, TrendingUp,
  Lightbulb, ArrowLeft, RefreshCw
} from 'lucide-vue-next'

export default defineComponent({
  name: 'AI',

  setup() {
    const router      = useRouter()
    const messages    = ref<ChatMessage[]>([])
    const input       = ref('')
    const loading     = ref(false)
    const insights    = ref('')
    const prediction  = ref('')
    const tip         = ref('')
    const activeTab   = ref<'chat' | 'insights' | 'predict' | 'tip'>('chat')
    const loadingTab  = ref(false)

    // Suggested questions for quick access
    const suggestions = [
      'How much did I spend this month?',
      'Which category am I overspending on?',
      'How long until I reach my savings goal?',
      'Give me a summary of my expenses',
      'Am I on track with my budget?',
      'Where can I cut back this month?'
    ]

    // Load insights on mount
    const loadInsights = async () => {
      if (insights.value) return
      loadingTab.value = true
      try {
        insights.value = await getInsights()
      } finally {
        loadingTab.value = false
      }
    }

    const loadPrediction = async () => {
      if (prediction.value) return
      loadingTab.value = true
      try {
        prediction.value = await getPrediction()
      } finally {
        loadingTab.value = false
      }
    }

    const loadTip = async () => {
      if (tip.value) return
      loadingTab.value = true
      try {
        tip.value = await getWeeklyTip()
      } finally {
        loadingTab.value = false
      }
    }

    const handleTabChange = async (tab: 'chat' | 'insights' | 'predict' | 'tip') => {
      activeTab.value = tab
      if (tab === 'insights') await loadInsights()
      if (tab === 'predict') await loadPrediction()
      if (tab === 'tip') await loadTip()
    }

    const handleRefresh = async () => {
      loadingTab.value = true
      try {
        if (activeTab.value === 'insights') {
          insights.value   = await getInsights()
        } else if (activeTab.value === 'predict') {
          prediction.value = await getPrediction()
        } else if (activeTab.value === 'tip') {
          tip.value        = await getWeeklyTip()
        }
      } finally {
        loadingTab.value = false
      }
    }

    const sendMessage = async (text?: string) => {
      const messageText = text || input.value.trim()
      if (!messageText || loading.value) return

      // Add user message
      messages.value.push({
        role:    'user',
        content: messageText
      })
      input.value  = ''
      loading.value = true

      try {
        // Send to AI with full history for context
        const reply = await sendChatMessage(
          messageText,
          messages.value.slice(0, -1) // exclude the message we just added
        )

        // Add AI response
        messages.value.push({
          role:    'assistant',
          content: reply
        })
      } catch (e) {
        messages.value.push({
          role:    'assistant',
          content: 'Sorry, I had trouble connecting. Make sure Ollama is running.'
        })
      } finally {
        loading.value = false

        // Scroll to bottom after message
        setTimeout(() => {
          const chatBox = document.getElementById('chat-messages')
          if (chatBox) chatBox.scrollTop = chatBox.scrollHeight
        }, 100)
      }
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }

    onMounted(loadInsights)

    const tabs = [
      { id: 'chat',     label: 'Chat',        icon: Bot },
      { id: 'insights', label: 'Insights',     icon: Sparkles },
      { id: 'predict',  label: 'Predictions',  icon: TrendingUp },
      { id: 'tip',      label: 'Saving Tip',   icon: Lightbulb },
    ]

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
                class="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div class="flex items-center gap-2">
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center"
                  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                >
                  <Bot size={18} color="white" />
                </div>
                <div>
                  <h1 class="text-lg font-bold text-gray-900 leading-none">
                    AI Assistant
                  </h1>
                  <p class="text-xs text-gray-400 mt-0.5">
                    Powered by Ollama
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh button for non-chat tabs */}
            {activeTab.value !== 'chat' && (
              <button
                onClick={handleRefresh}
                disabled={loadingTab.value}
                class="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <RefreshCw
                  size={16}
                  class={loadingTab.value ? 'animate-spin' : ''}
                />
              </button>
            )}
          </div>
        </nav>

        <div class="relative z-10 max-w-4xl mx-auto px-6 py-6">

          {/* Tabs */}
          <div class="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
            {tabs.map(tab => {
              const Icon    = tab.icon
              const isActive = activeTab.value === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={isActive
                    ? "background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white"
                    : "color:#6b7280"
                  }
                >
                  <Icon size={15} />
                  <span class="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── Chat Tab ── */}
          {activeTab.value === 'chat' && (
            <div class="flex flex-col" style="height:calc(100vh - 280px)">

              {/* Messages */}
              <div
                id="chat-messages"
                class="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-1"
              >
                {/* Welcome message */}
                {messages.value.length === 0 && (
                  <div class="text-center py-8">
                    <div
                      class="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style="background:linear-gradient(135deg,#ede9fe,#dbeafe)"
                    >
                      <Bot size={28} color="#6366f1" />
                    </div>
                    <h2 class="text-lg font-semibold text-gray-800 mb-1">
                      Hi! I'm your finance assistant
                    </h2>
                    <p class="text-sm text-gray-400 mb-6">
                      Ask me anything about your spending, budget or savings
                    </p>

                    {/* Suggested questions */}
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 text-left">
                      {suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          class="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat messages */}
                {messages.value.map((msg, index) => (
                  <div
                    key={index}
                    class={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={msg.role === 'user'
                        ? "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                        : "background:#f1f5f9"
                      }
                    >
                      {msg.role === 'user'
                        ? <span class="text-white text-xs font-bold">You</span>
                        : <Bot size={16} color="#6366f1" />
                      }
                    </div>

                    {/* Message bubble */}
                    <div
                      class="max-w-xs sm:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={msg.role === 'user'
                        ? "background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-bottom-right-radius:4px"
                        : "background:white;color:#1f2937;border-bottom-left-radius:4px;border:1px solid #f1f5f9"
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading.value && (
                  <div class="flex gap-3">
                    <div
                      class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style="background:#f1f5f9"
                    >
                      <Bot size={16} color="#6366f1" />
                    </div>
                    <div
                      class="rounded-2xl px-4 py-3 flex items-center gap-2"
                      style="background:white;border:1px solid #f1f5f9;border-bottom-left-radius:4px"
                    >
                      <div class="flex gap-1">
                        <div
                          class="w-2 h-2 rounded-full animate-bounce"
                          style="background:#6366f1;animation-delay:0ms"
                        />
                        <div
                          class="w-2 h-2 rounded-full animate-bounce"
                          style="background:#6366f1;animation-delay:150ms"
                        />
                        <div
                          class="w-2 h-2 rounded-full animate-bounce"
                          style="background:#6366f1;animation-delay:300ms"
                        />
                      </div>
                      <span class="text-xs text-gray-400">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input box */}
              <div
                class="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Ask about your finances..."
                  value={input.value}
                  onInput={(e: Event) =>
                    input.value = (e.target as HTMLInputElement).value
                  }
                  onKeypress={handleKeyPress}
                  disabled={loading.value}
                  class="flex-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading.value || !input.value.trim()}
                  class="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  style={input.value.trim() && !loading.value
                    ? "background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "background:#e5e7eb"
                  }
                >
                  <Send
                    size={15}
                    color={input.value.trim() && !loading.value ? 'white' : '#9ca3af'}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── Insights Tab ── */}
          {activeTab.value === 'insights' && (
            <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center"
                  style="background:linear-gradient(135deg,#6366f1,#8b5cf6)"
                >
                  <Sparkles size={18} color="white" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-gray-800">
                    AI Insights
                  </h2>
                  <p class="text-xs text-gray-400">
                    Based on your spending patterns
                  </p>
                </div>
              </div>

              {loadingTab.value ? (
                <div class="flex items-center gap-3 text-gray-400 py-8 justify-center">
                  <div
                    class="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"
                  />
                  <span class="text-sm">Analyzing your finances...</span>
                </div>
              ) : (
                <div
                  class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-indigo-50 rounded-xl p-4"
                >
                  {insights.value}
                </div>
              )}
            </div>
          )}

          {/* ── Predictions Tab ── */}
          {activeTab.value === 'predict' && (
            <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center"
                  style="background:linear-gradient(135deg,#f97316,#ef4444)"
                >
                  <TrendingUp size={18} color="white" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-gray-800">
                    Spending Predictions
                  </h2>
                  <p class="text-xs text-gray-400">
                    What next month might look like
                  </p>
                </div>
              </div>

              {loadingTab.value ? (
                <div class="flex items-center gap-3 text-gray-400 py-8 justify-center">
                  <div
                    class="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"
                  />
                  <span class="text-sm">Predicting your spending...</span>
                </div>
              ) : (
                <div
                  class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-orange-50 rounded-xl p-4"
                >
                  {prediction.value}
                </div>
              )}
            </div>
          )}

          {/* ── Tip Tab ── */}
          {activeTab.value === 'tip' && (
            <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center"
                  style="background:linear-gradient(135deg,#16a34a,#15803d)"
                >
                  <Lightbulb size={18} color="white" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-gray-800">
                    Saving Tip
                  </h2>
                  <p class="text-xs text-gray-400">
                    Personalized just for you
                  </p>
                </div>
              </div>

              {loadingTab.value ? (
                <div class="flex items-center gap-3 text-gray-400 py-8 justify-center">
                  <div
                    class="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"
                  />
                  <span class="text-sm">Generating your tip...</span>
                </div>
              ) : (
                <div
                  class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-green-50 rounded-xl p-4"
                >
                  {tip.value}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
})
