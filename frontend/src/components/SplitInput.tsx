import { defineComponent, ref } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'

export interface SplitEntry {
  friend_name: string
  amount_owed: number
}

export default defineComponent({
  name: 'SplitInput',

  props: {
    totalAmount: {
      type: Number,
      required: true
    },
    onSplitsChange: {
      type: Function,
      required: true
    }
  },

  setup(props) {
    const splits = ref<{ friend_name: string; amount_owed: string }[]>([
      { friend_name: '', amount_owed: '' }
    ])

    const addSplit = () => {
      splits.value.push({ friend_name: '', amount_owed: '' })
    }

    const removeSplit = (index: number) => {
      splits.value.splice(index, 1)
      emitSplits()
    }

    const emitSplits = () => {
      // Only emit valid splits where both fields are filled
      const valid = splits.value
        .filter(s => s.friend_name.trim() && Number(s.amount_owed) > 0)
        .map(s => ({
          friend_name: s.friend_name.trim(),
          amount_owed: Number(s.amount_owed)
        }))
      props.onSplitsChange(valid)
    }

    // Total amount assigned to friends
    const assignedTotal = () =>
      splits.value.reduce((sum, s) => sum + (Number(s.amount_owed) || 0), 0)

    // Your share = total - what friends owe
    const yourShare = () =>
      Math.max(props.totalAmount - assignedTotal(), 0)

    const inputClass = "border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"

    return () => (
      <div class="bg-indigo-50 rounded-xl p-4 mt-2">
        <p class="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">
          Split with friends
        </p>

        {/* Split rows */}
        <div class="flex flex-col gap-2 mb-3">
          {splits.value.map((split, index) => (
            <div key={index} class="flex items-center gap-2">
              {/* Friend name */}
              <input
                type="text"
                placeholder="Friend name"
                value={split.friend_name}
                onInput={(e: Event) => {
                  split.friend_name = (e.target as HTMLInputElement).value
                  emitSplits()
                }}
                class={`flex-1 ${inputClass}`}
              />

              {/* Amount */}
              <input
                type="number"
                placeholder="Amount"
                value={split.amount_owed}
                onInput={(e: Event) => {
                  split.amount_owed = (e.target as HTMLInputElement).value
                  emitSplits()
                }}
                class={`w-28 ${inputClass}`}
              />

              {/* Remove button */}
              {splits.value.length > 1 && (
                <button
                  onClick={() => removeSplit(index)}
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add friend button */}
        <button
          onClick={addSplit}
          class="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-3"
        >
          <Plus size={13} />
          Add another friend
        </button>

        {/* Summary */}
        {props.totalAmount > 0 && (
          <div class="bg-white rounded-lg p-3 text-xs">
            <div class="flex justify-between text-gray-500 mb-1">
              <span>Total bill</span>
              <span class="font-medium text-gray-700">
                ₹{props.totalAmount.toLocaleString()}
              </span>
            </div>
            <div class="flex justify-between text-gray-500 mb-1">
              <span>Friends owe</span>
              <span class="font-medium text-orange-500">
                − ₹{assignedTotal().toLocaleString()}
              </span>
            </div>
            <div class="flex justify-between font-semibold border-t border-gray-100 pt-1 mt-1">
              <span class="text-gray-700">Your share</span>
              <span style="color:#6366f1">
                ₹{yourShare().toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
})
